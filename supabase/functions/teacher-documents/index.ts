import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const DOCUMENT_TYPES = ['id_document', 'certification', 'portfolio', 'avatar'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile and teacher role
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('external_auth_id', userData.user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: teacherRole } = await serviceClient
      .from('user_roles')
      .select('tenant_id')
      .eq('profile_id', profile.id)
      .eq('role', 'teacher')
      .single();

    if (!teacherRole) {
      return new Response(
        JSON.stringify({ error: 'Not a teacher' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teacherId = teacherRole.tenant_id;

    // Ensure storage bucket exists
    const { data: buckets } = await serviceClient.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'teacher-documents');
    
    if (!bucketExists) {
      await serviceClient.storage.createBucket('teacher-documents', {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    }

    // Handle GET - list documents
    if (req.method === 'GET') {
      const { data: documents } = await serviceClient
        .from('teacher_documents')
        .select('*')
        .eq('tenant_id', teacherId)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ documents: documents || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST - upload document
    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const documentType = formData.get('type') as string;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!documentType || !DOCUMENT_TYPES.includes(documentType)) {
        return new Response(
          JSON.stringify({ error: `Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: 'File too large. Maximum size is 10MB' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${teacherId}/${documentType}/${timestamp}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await serviceClient.storage
        .from('teacher-documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create document record
      const { data: document, error: insertError } = await serviceClient
        .from('teacher_documents')
        .insert({
          tenant_id: teacherId,
          type: documentType,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        // Clean up uploaded file
        await serviceClient.storage.from('teacher-documents').remove([filePath]);
        return new Response(
          JSON.stringify({ error: 'Failed to create document record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log audit entry
      await serviceClient.from('audit_logs').insert({
        tenant_id: teacherId,
        entity_type: 'teacher_document',
        entity_id: document.id,
        action: 'document_uploaded',
        actor_id: profile.id,
        actor_type: 'teacher',
        new_values: { type: documentType, file_name: file.name },
      });

      console.log(`Document uploaded: ${file.name} for teacher ${teacherId}`);

      return new Response(
        JSON.stringify({ success: true, document }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle DELETE - remove document
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const documentId = url.searchParams.get('id');

      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'Document ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get document and verify ownership
      const { data: document } = await serviceClient
        .from('teacher_documents')
        .select('*')
        .eq('id', documentId)
        .eq('tenant_id', teacherId)
        .single();

      if (!document) {
        return new Response(
          JSON.stringify({ error: 'Document not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from storage
      await serviceClient.storage.from('teacher-documents').remove([document.file_path]);

      // Delete record
      await serviceClient
        .from('teacher_documents')
        .delete()
        .eq('id', documentId);

      // Log audit entry
      await serviceClient.from('audit_logs').insert({
        tenant_id: teacherId,
        entity_type: 'teacher_document',
        entity_id: documentId,
        action: 'document_deleted',
        actor_id: profile.id,
        actor_type: 'teacher',
        old_values: { type: document.type, file_name: document.file_name },
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Teacher documents error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
