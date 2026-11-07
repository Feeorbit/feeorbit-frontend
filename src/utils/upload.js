/**
 * Upload an image (File, Blob, or base64 data) to Cloudinary via /api/upload
 * @param {File|Blob|string} fileOrData - Image file or base64 string
 * @param {string} [folder='feeorbit/uploads'] - Destination folder in Cloudinary
 * @returns {Promise<{ success: boolean, url: string, publicId: string }>}
 */
export async function uploadImageToCloudinary(fileOrData, folder = 'feeorbit/uploads') {
  let body;
  let headers = {};

  if (fileOrData instanceof File || fileOrData instanceof Blob) {
    const formData = new FormData();
    formData.append('image', fileOrData);
    formData.append('folder', folder);
    body = formData;
  } else if (typeof fileOrData === 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ image: fileOrData, folder });
  } else {
    throw new Error('Invalid file format. Please select an image file.');
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Image upload failed.');
  }

  return data;
}
