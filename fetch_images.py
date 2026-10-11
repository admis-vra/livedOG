import urllib.request, urllib.parse, json
import time

animes = ['Death Note', 'Jujutsu Kaisen', 'Naruto', 'Classroom of the Elite', 'One Punch Man', 'Wind Breaker', 'Demon Slayer']
for s in animes:
    url = f'https://api.jikan.moe/v4/anime?q={urllib.parse.quote(s)}&limit=1'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        data = json.loads(urllib.request.urlopen(req).read())
        if data['data']:
            print(f'{s}: {data["data"][0]["images"]["jpg"]["large_image_url"]}')
    except Exception as e:
        print(f'{s}: Error {e}')
    time.sleep(1) # rate limit

shows = ['Bloodhounds', 'Stranger Things', 'The Social Network', 'The Boys', 'Avengers Endgame']
for s in shows:
    url = f'https://api.tvmaze.com/search/shows?q={urllib.parse.quote(s)}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        data = json.loads(urllib.request.urlopen(req).read())
        if data and data[0]['show']['image']:
            print(f'{s}: {data[0]["show"]["image"]["original"]}')
    except Exception as e:
        print(f'{s}: Error {e}')
