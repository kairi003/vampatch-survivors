
const getBaseData = async () => {
  const baseFileInput = document.querySelector('#baseFileInput');
  const layoutFileInput = document.querySelector('#layoutFileInput');
  const baseFile = baseFileInput.files[0];
  const layoutFile = layoutFileInput.files[0];

  if (baseFile?.type != 'image/png' || layoutFile?.type != 'application/json')
    throw '正しい形式のファイルを選択してください';

  const baseImage = await createImageBitmap(baseFile);
  const layoutData = JSON.parse(await layoutFile.text());

  if (layoutData?.textures?.[0]?.image != 'characters.png') 
    throw '正しい形式のcharacters.jsonを選択してください'

  const {w, h} = layoutData.textures[0].size;
  if (baseImage.width != w || baseImage.height != h)
    throw 'characters.pngとcharacters.jsonのバージョンが異なります';
  
  return {baseImage, layoutData};
}


document.querySelector('#splitButton').addEventListener('click', async e => {
  try {
    const {baseImage, layoutData} = await getBaseData();

    const canvas = document.createElement('canvas');
    const zip = new JSZip();
    for (const {filename, frame: {x, y, w, h}} of layoutData.textures[0].frames) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(baseImage, -x, -y);
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      zip.file(filename, blob, {binary: true});
    }
  
    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, 'split_characters.zip');
  } catch(e) {
    alert(e);
    throw e;
  }
});


document.querySelector('#applyButton').addEventListener('click', async e => {
  try {
    const {baseImage, layoutData} = await getBaseData();

    const canvas = document.createElement('canvas');
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(baseImage, 0, 0);

    const filemap = new Map(layoutData.textures[0].frames.map(fr=>[fr.filename, fr.frame]));
    for (const file of customFileInput.files) {
      if (!filemap.has(file.name)) continue;

      const {x, y, w, h} = filemap.get(file.name);
      const img = await createImageBitmap(file);
      if (img.width != w || img.height != h) continue
      
      ctx.clearRect(x, y, w, h);
      ctx.drawImage(img, x, y);
    }
    const content = await new Promise(resolve => canvas.toBlob(resolve));
    saveAs(content, 'characters.png');
  } catch(e) {
    alert(e);
    throw e;
  }
});
