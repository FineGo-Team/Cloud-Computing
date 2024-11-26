# Gunakan gambar Node.js resmi sebagai gambar dasar
FROM node:22

# Buat dan berpindah ke direktori aplikasi
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json ke WORKDIR
COPY package*.json ./

# Instal dependensi
RUN npm install

# Salin seluruh kode aplikasi ke WORKDIR
COPY . .

# Tampilkan port yang digunakan oleh aplikasi
EXPOSE 8080

# Tentukan perintah untuk menjalankan aplikasi
CMD ["node", "server.js"]
