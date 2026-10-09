# Zovixa-ai (step 1: Text → Video)

1. Node.js 18+ lagaiye.
2. replicate.com par account banaiye, API token lijiye.
3. https://replicate.com/collections/text-to-video se ek model chuniye. Uska naam (owner/model-name) aur uske input ke naam model page par dikhte hain.
4. `cp env.example .env` karke token aur model bhariye.
5. `npm install` phir `npm start`, aur http://localhost:3000 kholiye.

Online daalne ke liye Railway ya Render par repo jodiye, aur .env wali cheezein "Environment variables" mein daliye.
API token kabhi page ke code mein mat likhiye.

Replicate se mili video ka link kuch der baad expire hota hai. Video sambhal kar rakhni ho to aage storage (jaise S3) jodna hoga.
Paise ki suraksha: DAILY_LIMIT aur HOURLY_PER_IP isi liye hain. Login aur payment agle step mein.
