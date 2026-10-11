import urllib.request, urllib.parse, json

shows = ['Lost in Space', 'Lucifer']
for s in shows:
    url = f'https://api.tvmaze.com/search/shows?q={urllib.parse.quote(s)}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        data = json.loads(urllib.request.urlopen(req).read())
        if data and data[0]['show']['image']:
            print(f'{s}: {data[0]["show"]["image"]["original"]}')
    except Exception as e:
        print(f'{s}: Error {e}')
