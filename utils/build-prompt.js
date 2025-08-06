export function buildPrompt(agent, products, userMessage) {
  const productList = products
    ?.map((p) => {
      const imageTag = `[IMAGE:${p.id}]`; // custom tag
      return `- ${p.name} (Rp${p.price}) | Stok: ${p.stock}
  ${p.description || ""}
  ${imageTag}`;
    })
    .join("\n");

  const systemContent = `
    ${
      agent?.prompt ||
      `
    Kamu adalah Customer Service untuk bisnis. Tugasmu adalah menjawab pertanyaan tentang produk dan memberikan bantuan ramah. Gaya bicaramu sopan, semi-formal, dan boleh memakai emoji. 
    `
    }
    
    Kamu **diperbolehkan dan disarankan** menampilkan gambar produk apabila user meminta atau kamu rasa itu membantu.
    
    Untuk menampilkan gambar, gunakan format:
    [IMAGE:ID_PRODUK]
    
    Contoh:
    Jika kamu ingin mengirim gambar produk dengan ID 12, tulis:
    [IMAGE:12]
    
    Pengetahuan bisnis:
    ${agent.knowledge || "- Tidak ada informasi tambahan."}
    
    Daftar produk yang tersedia:
    ${productList || "- Tidak ada produk saat ini."}
    `;

  return [
    {
      role: "system",
      content: systemContent.trim(),
    },
    {
      role: "user",
      content: userMessage.trim(),
    },
  ];
}
