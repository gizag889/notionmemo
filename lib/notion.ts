export const fetchNotionData = async () => {
  // 指定したページの「子ブロック」を取得
  const response = await fetch(
    `https://api.notion.com/v1/blocks/${process.env.EXPO_PUBLIC_BLOCK_ID}/children`,
    {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();

  const textBlocks = data.results
    //notion APIの階層からparagraphを取り出す
    .filter((block: any) => block.type === "paragraph")
    .map(
      (block: any) =>
        block.paragraph.rich_text.map((t: any) => t.plain_text).join("") || "",
    );
  console.log(textBlocks);

  return textBlocks.length > 0
    ? textBlocks
    : ["内容が空か、読み取れるテキストがありません。"];
};
