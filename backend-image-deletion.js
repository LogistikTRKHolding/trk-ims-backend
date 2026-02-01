// ==========================================
// BACKEND ENHANCEMENT - Image Deletion
// Add to server.js (Optional but Recommended)
// ==========================================

// At the top of server.js, add:
//const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhhqqxgaj',
  api_key: process.env.CLOUDINARY_API_KEY || '436287539452467',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'napwQNvhstPm7Ofrm8xe3qo8_ss',
});

// ==========================================
// Helper Function: Extract Public ID
// ==========================================

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} - Public ID or null
 * 
 * Example:
 * Input: https://res.cloudinary.com/demo/image/upload/v1234/folder/image.jpg
 * Output: folder/image
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Split by /upload/
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    // Get path after /upload/
    const pathParts = parts[1].split('/');
    
    // Remove version (v1234567890)
    const filteredParts = pathParts.filter(part => !part.startsWith('v'));
    
    // Join and remove file extension
    const publicId = filteredParts.join('/').replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

// ==========================================
// API Endpoint: Delete Image
// ==========================================

/**
 * DELETE /api/images/:publicId
 * Deletes image from Cloudinary
 * 
 * Usage from frontend:
 * DELETE /api/images/trk-inventory%2Fbarang%2Fimage123
 */
app.delete('/api/images/:publicId', authenticateToken, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    
    console.log('Deleting image with public ID:', publicId);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ 
        success: true, 
        message: 'Image deleted successfully',
        result: result 
      });
    } else if (result.result === 'not found') {
      res.status(404).json({ 
        success: false, 
        error: 'Image not found in Cloudinary' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to delete image',
        result: result 
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==========================================
// API Endpoint: Delete Image by URL
// ==========================================

/**
 * POST /api/images/delete-by-url
 * Deletes image using full Cloudinary URL
 * 
 * Body: { "url": "https://res.cloudinary.com/..." }
 */
app.post('/api/images/delete-by-url', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image URL is required' 
      });
    }

    // Extract public ID from URL
    const publicId = getPublicIdFromUrl(url);

    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Cloudinary URL' 
      });
    }

    console.log('Deleting image:', publicId);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ 
        success: true, 
        message: 'Image deleted successfully',
        publicId: publicId 
      });
    } else if (result.result === 'not found') {
      res.status(404).json({ 
        success: false, 
        error: 'Image not found' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to delete image' 
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==========================================
// Enhanced DELETE Barang Endpoint
// Auto-delete associated image
// ==========================================

/**
 * DELETE /api/data/barang/:id
 * Enhanced to also delete image from Cloudinary
 */
app.delete('/api/data/barang/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. First, get the item to find image URL
    const { data: item, error: fetchError } = await supabase
      .from('barang')
      .select('gambar_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // 2. Delete from database
    const { error: deleteError } = await supabase
      .from('barang')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 3. Delete image from Cloudinary (if exists)
    if (item.gambar_url) {
      try {
        const publicId = getPublicIdFromUrl(item.gambar_url);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log('Image deleted from Cloudinary:', result);
        }
      } catch (imageError) {
        // Log error but don't fail the request
        console.error('Failed to delete image:', imageError);
        // Image delete failed, but item already deleted from DB
      }
    }

    res.json({ 
      success: true, 
      message: 'Item and image deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Enhanced UPDATE Barang Endpoint
// Auto-delete old image when updating with new
// ==========================================

/**
 * PUT /api/data/barang/:id
 * Enhanced to delete old image when new one is uploaded
 */
app.put('/api/data/barang/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Get current item to check for existing image
    const { data: currentItem, error: fetchError } = await supabase
      .from('barang')
      .select('gambar_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // 2. Update item in database
    const { data, error } = await supabase
      .from('barang')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    // 3. Delete old image if:
    //    - Old image existed
    //    - New image is different
    //    - New image is not empty
    const oldImageUrl = currentItem.gambar_url;
    const newImageUrl = updateData.gambar_url;

    if (oldImageUrl && newImageUrl && oldImageUrl !== newImageUrl) {
      try {
        const publicId = getPublicIdFromUrl(oldImageUrl);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log('Old image deleted:', result);
        }
      } catch (imageError) {
        // Log but don't fail request
        console.error('Failed to delete old image:', imageError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Utility Endpoint: List Cloudinary Images
// For debugging/admin purposes
// ==========================================

/**
 * GET /api/images/list
 * List all images in Cloudinary folder
 * Admin only
 */
app.get('/api/images/list', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'trk-inventory/barang', // Folder path
      max_results: 500,
    });

    res.json({
      success: true,
      count: result.resources.length,
      images: result.resources.map(img => ({
        publicId: img.public_id,
        url: img.secure_url,
        format: img.format,
        size: img.bytes,
        created: img.created_at,
      })),
    });
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Utility: Cleanup Unused Images
// Find images in Cloudinary that are not in database
// ==========================================

/**
 * GET /api/images/cleanup-check
 * Check for unused images
 * Admin only
 */
app.get('/api/images/cleanup-check', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // 1. Get all images from Cloudinary
    const cloudinaryResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'trk-inventory/barang',
      max_results: 500,
    });

    const cloudinaryUrls = new Set(
      cloudinaryResult.resources.map(img => img.secure_url)
    );

    // 2. Get all image URLs from database
    const { data: barangList, error } = await supabase
      .from('barang')
      .select('gambar_url')
      .not('gambar_url', 'is', null);

    if (error) throw error;

    const dbUrls = new Set(
      barangList.map(item => item.gambar_url).filter(Boolean)
    );

    // 3. Find unused images (in Cloudinary but not in DB)
    const unusedImages = [];
    cloudinaryUrls.forEach(url => {
      if (!dbUrls.has(url)) {
        unusedImages.push(url);
      }
    });

    res.json({
      success: true,
      totalInCloudinary: cloudinaryUrls.size,
      totalInDatabase: dbUrls.size,
      unusedCount: unusedImages.length,
      unusedImages: unusedImages,
    });
  } catch (error) {
    console.error('Cleanup check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Environment Variables (.env)
// ==========================================

/*
Add to .env file:

CLOUDINARY_CLOUD_NAME=dhhqqxgaj
CLOUDINARY_API_KEY=436287539452467
CLOUDINARY_API_SECRET=napwQNvhstPm7Ofrm8xe3qo8_ss

Then update cloudinary.config to use env vars:

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
*/

// ==========================================
// Install Required Package
// ==========================================

/*
Run in terminal:

npm install cloudinary

Then restart server.
*/

// ==========================================
// Frontend Usage Example
// ==========================================

/*
// In Barang.jsx

const handleDelete = async (item) => {
  if (!confirm(`Delete ${item.nama_barang}?`)) return;

  try {
    const token = localStorage.getItem('authToken');
    
    // Backend will auto-delete image
    const response = await fetch(`http://localhost:3000/api/data/barang/${item.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Delete failed');

    alert('Item and image deleted!');
    await refresh();
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// Manual image deletion (if needed)
const deleteImage = async (imageUrl) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:3000/api/images/delete-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url: imageUrl }),
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Image deleted!');
    } else {
      alert('Failed: ' + result.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
*/

// ==========================================
// Testing the Endpoints
// ==========================================

/*
1. Test delete by URL:
curl -X POST http://localhost:3000/api/images/delete-by-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://res.cloudinary.com/dhhqqxgaj/image/upload/v123/trk-inventory/barang/image.jpg"}'

2. Test list images:
curl -X GET http://localhost:3000/api/images/list \
  -H "Authorization: Bearer YOUR_TOKEN"

3. Test cleanup check:
curl -X GET http://localhost:3000/api/images/cleanup-check \
  -H "Authorization: Bearer YOUR_TOKEN"
*/

module.exports = {
  getPublicIdFromUrl,
  cloudinary,
};
