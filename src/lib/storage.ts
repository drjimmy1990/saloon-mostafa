import { supabase as storageClient } from './supabase';

/**
 * Uploads a file to Supabase Storage and returns its public URL
 */
export async function uploadImage(file: File, bucket: string = 'saloon_uploads', pathPrefix: string = 'images'): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload Error:', error.message);
      throw error;
    }

    const { data: publicData } = storageClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image:', err);
    throw err;
  }
}

/**
 * Deletes a file from Supabase Storage using its public URL
 */
export async function deleteImage(publicUrl: string, bucket: string = 'saloon_uploads'): Promise<boolean> {
  try {
    // Extract file path from public URL
    // e.g. https://...supabase.co/storage/v1/object/public/saloon_uploads/images/abc.jpg
    const bucketPathStr = `/storage/v1/object/public/${bucket}/`;
    if (!publicUrl.includes(bucketPathStr)) {
      return false; // Not a Supabase storage URL for this bucket
    }
    
    const filePath = publicUrl.split(bucketPathStr)[1];
    if (!filePath) return false;

    const { error } = await storageClient.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete image:', err);
    return false;
  }
}
