export function comprimirImagem(file: File, max = 900, qualidade = 0.82): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > h && w > max) { h = Math.round(h * max / w); w = max }
        else if (h > max)     { w = Math.round(w * max / h); h = max }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', qualidade))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}
