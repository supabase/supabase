const base64SVG = (svgContents) =>
  Buffer.from(
    svgContents
      .replace('\n', '')
      .replace(
        'stroke="currentColor"',
        'stroke="#000" style="background-color: #fff; border-radius: 2px"',
      ),
  ).toString('base64');

export default base64SVG;
