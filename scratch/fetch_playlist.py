import urllib.request
import json
import re
import sys

def fetch_playlist(playlist_id):
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    match = re.search(r'var ytInitialData = (\{.*?\});', html)
    if not match:
        print(f"ytInitialData not found for {playlist_id}")
        return []
    
    data = json.loads(match.group(1))
    
    videos = []
    try:
        tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
        for t in tabs:
            if 'tabRenderer' in t:
                content = t['tabRenderer']['content']
                if 'sectionListRenderer' in content:
                    items = content['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents']
                    for item in items:
                        if 'playlistVideoRenderer' in item:
                            vid = item['playlistVideoRenderer']
                            title = vid['title']['runs'][0]['text']
                            videoId = vid['videoId']
                            videos.append({'title': title, 'url': f"https://www.youtube.com/watch?v={videoId}"})
                    break
    except Exception as e:
        print(f"Error parsing playlist {playlist_id}: {e}")
        
    return videos

if __name__ == '__main__':
    p1 = fetch_playlist("PLYIuEc8dUeUCC_L1m1zo4De4sIclgf4fm")
    p2 = fetch_playlist("PLUMlPznumOdU")
    
    with open('scratch/videos.json', 'w') as f:
        json.dump({'p1': p1, 'p2': p2}, f, indent=2)
    print("Done")
