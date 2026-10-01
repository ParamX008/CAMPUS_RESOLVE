import urllib.request
import re

url = 'https://www.shiksha.com/college/supreme-knowledge-foundation-group-of-institutions-hooghly-35375/gallery'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://images\.shiksha\.com/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
        print('Found', len(matches), 'images')
        for img in set(matches[:20]):
            print(img)
except Exception as e:
    print('Error:', e)
