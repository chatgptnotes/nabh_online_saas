import { supabase } from '../lib/supabase';

export interface DepartmentDocument {
  id: string;
  department_code: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  extracted_text: string | null;
  uploaded_at: string;
}

export const departmentDocumentStorage = {
  async getDocuments(deptCode: string): Promise<DepartmentDocument[]> {
    const { data, error } = await (supabase
      .from('department_documents') as any)
      .select('*')
      .eq('department_code', deptCode)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[DeptDocStorage] getDocuments error:', error);
      throw error;
    }
    return (data as DepartmentDocument[]) || [];
  },

  async uploadFile(deptCode: string, file: File, parentId?: string): Promise<DepartmentDocument> {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = parentId
      ? `[parent:${parentId}]${file.name}`
      : file.name;
    const storagePath = `departments/${deptCode}/${timestamp}_${random}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

    const { data, error } = await (supabase
      .from('department_documents') as any)
      .insert({
        department_code: deptCode,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DepartmentDocument;
  },

  async saveManualEntry(deptCode: string, title: string, description: string): Promise<DepartmentDocument> {
    const { data, error } = await (supabase
      .from('department_documents') as any)
      .insert({
        department_code: deptCode,
        file_name: title,
        file_url: 'manual-entry',
        file_type: 'manual',
        file_size: 0,
        extracted_text: JSON.stringify({ title, description, documentType: 'manual' }),
      })
      .select()
      .single();

    if (error) throw error;
    return data as DepartmentDocument;
  },

  async updateExtractedText(id: string, extractedText: string): Promise<void> {
    const { error } = await (supabase
      .from('department_documents') as any)
      .update({ extracted_text: extractedText })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteDocument(doc: DepartmentDocument): Promise<void> {
    // Delete children first (files uploaded under this title)
    if (doc.file_url === 'manual-entry') {
      const { data: children } = await (supabase
        .from('department_documents') as any)
        .select('*')
        .eq('department_code', doc.department_code)
        .like('file_name', `[parent:${doc.id}]%`);

      if (children) {
        for (const child of children) {
          await this.deleteDocument(child);
        }
      }
    }

    // Delete from storage if it's an uploaded file
    if (doc.file_url && doc.file_url !== 'manual-entry') {
      const path = doc.file_url.split('/documents/')[1];
      if (path) {
        await supabase.storage.from('documents').remove([path]);
      }
    }

    // Delete DB record
    const { error } = await (supabase
      .from('department_documents') as any)
      .delete()
      .eq('id', doc.id);

    if (error) throw error;
  },
};
