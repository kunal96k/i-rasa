import os
import re

def fix_footer_icons():
    # Set the root directory of the project
    root_dir = '.' 
    
    # Define the mapping of old patterns to new patterns
    replacements = [
        (r'<span class="fa fa-location-arrow"></span>', '<span><i class="fas fa-map-marker-alt"></i></span>'),
        (r'<span class="fa fa-phone"></span>', '<span><i class="fas fa-phone-alt"></i></span>'),
        (r'<span class="fa fa-envelope"></span>', '<span><i class="fas fa-envelope"></i></span>'),
        # Handle variations in whitespace and tabs
        (r'<span\s+class="fa fa-location-arrow"\s*>\s*</span>', '<span><i class="fas fa-map-marker-alt"></i></span>'),
        (r'<span\s+class="fa fa-phone"\s*>\s*</span>', '<span><i class="fas fa-phone-alt"></i></span>'),
        (r'<span\s+class="fa fa-envelope"\s*>\s*</span>', '<span><i class="fas fa-envelope"></i></span>')
    ]

    for root, dirs, files in os.walk(root_dir):
        for filename in files:
            if filename.endswith('.html'):
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    for old, new in replacements:
                        content = re.sub(old, new, content)
                    
                    if content != original_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Fixed footer icons in {filename}")
                except Exception as e:
                    print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    print("Starting footer icon fix...")
    fix_footer_icons()
    print("All files processed.")
