const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'index.html',
    'category.html',
    'categoryWomen.html',
    'attar.html',
    'single-product.html',
    'blog.html',
    'single-blog.html'
];

const newImages = [
    'img/i_rasa_bottles/5845c656-1ecf-4943-9aad-16f6764ba573.jfif',
    'img/i_rasa_bottles/5ba999bf-b1d0-43bb-b1fb-e495ea8c8b3b.jfif',
    'img/i_rasa_bottles/79245e6a-ff41-48d6-a737-96b15c7f5a31.jfif',
    'img/i_rasa_bottles/9541adbe-aff3-4ed4-bf90-447ce1b94e10.jfif',
    'img/i_rasa_bottles/b6567052-f1fa-4c6f-b4e7-39917667b99e.jfif',
    'img/i_rasa_bottles/f2b34ddf-2479-4913-a0b1-4e437c70b8de.jfif',
    'img/i_rasa_bottles/Gemini_Generated_Image_13yc2413yc2413yc.png',
    'img/i_rasa_bottles/Gemini_Generated_Image_1ht3cv1ht3cv1ht3.png',
    'img/i_rasa_bottles/Gemini_Generated_Image_59242l59242l5924.png',
    'img/i_rasa_bottles/Gemini_Generated_Image_b6qufb6qufb6qufb.png',
    'img/i_rasa_bottles/Gemini_Generated_Image_h6kuafh6kuafh6ku.png'
];

const gucciFloraImage = 'img/i_rasa_bottles/gucci_flora.jfif';
const singleProductImage = 'img/i_rasa_bottles/single-product_image.jfif';
const sp1AvifImage = 'img/i_rasa_bottles/single-product_image.jfif';

let randomIdx = 0;
function getRandomImage() {
    const img = newImages[randomIdx % newImages.length];
    randomIdx++;
    return img;
}

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace Gucci Flora references specifically if they exist
    content = content.replace(/(<img[^>]*src=")(img\/product\/[^"]+)("[^>]*alt="Gucci Flora"[^>]*>)/gi, `$1${gucciFloraImage}$3`);
    content = content.replace(/(data-img=")(img\/product\/[^"]+)(")([^>]*>.*?Gucci Flora.*?<\/button>)/gis, `$1${gucciFloraImage}$3$4`);
    
    // Replace single-product.html main image
    content = content.replace(/img\/category\/s-p1\.avif/g, sp1AvifImage);

    // Replace all other img/product/... with random images from our pool
    content = content.replace(/img\/product\/[^"']+\.(jpg|png|jpeg|jfif|avif|webp)/gi, (match) => {
        if (match.includes('review-')) return match; // don't replace review images
        if (match.includes('gucci_flora.jfif')) return match; // already replaced
        return getRandomImage();
    });

    // Replace instagram section images
    content = content.replace(/img\/instagram\/ins-\d+\.(jpg|png|jpeg|webp)/gi, (match) => {
        return getRandomImage();
    });

    // Replace specific blog images
    content = content.replace(/img\/blog\/main-blog\/m-blog-1\.avif/g, () => getRandomImage());
    content = content.replace(/img\/blog\/main-blog\/m-blog-3\.avif/g, () => getRandomImage());

    // Replace Hero carousel images in index.html and style them with object-fit
    content = content.replace(/<img src="img\/home\/hero-slide1\.png" alt="" class="img-fluid">/g, '<img src="' + newImages[7] + '" alt="" class="img-fluid" style="height: 400px; object-fit: cover; width: 100%;">');
    content = content.replace(/<img src="img\/home\/hero-slide2\.png" alt="" class="img-fluid">/g, '<img src="' + newImages[8] + '" alt="" class="img-fluid" style="height: 400px; object-fit: cover; width: 100%;">');
    content = content.replace(/<img src="img\/home\/hero-slide3\.png" alt="" class="img-fluid">/g, '<img src="' + newImages[9] + '" alt="" class="img-fluid" style="height: 400px; object-fit: cover; width: 100%;">');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Replaced images in ${file}`);
});
