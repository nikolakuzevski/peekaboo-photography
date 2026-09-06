Тука одат само ако видеата се сопствени MP4 фајлови (не YouTube, не Instagram):

1. Копирај го .mp4 фајлот и постер-сликата (WebP, ~1600px по подолгата страна)
   во оваа папка.
2. Отвори content/site-data.js, дел videos: [ и додај:
   { type: 'mp4', src: 'images/videos/film.mp4',
     poster: 'images/videos/film-poster.webp', title: 'Наслов' }

Ако видеото е на YouTube или Instagram, овде не оди ништо — само линк во
site-data.js. Детално упатство има во README.md во главната папка.
