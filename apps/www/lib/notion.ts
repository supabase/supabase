// https://www.npmjs.com/package/@notionhq/client
import { NotionBlocksMarkdownParser } from '@notion-stuff/blocks-markdown-parser';
import { Client, iteratePaginatedAPI } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function getNotionDatabase(limit?: number) {
  const databaseId = process.env.NOTION_DATABASE_ID!;
  const response = await notion.databases.query({
    database_id: databaseId,
  }).catch((error) => {console.log((error.message))});

  return response?.results?.slice(0,limit ?? 3);
}

export async function getNotionPageContent(page_id: string) {
  const response = await notion.pages.retrieve({
    page_id: page_id,
  }).catch((error) => {console.log((error.message))});

  return response;
}

export function addSlugToEvent(event: any) {
  // const slug = "notion-" + event.properties.Name.title[0].plain_text.toLowerCase().replace(/\s/g, "-")
  const slug = event.id.replaceAll('-', '')

  return {
    ...event,
    slug
  };
}

export const addSlugToEvents = (events: any) => events.map(addSlugToEvent)

export async function getDatabaseBlocks(parentBlockId: string) {
  let blocks = []
  for await (const block of iteratePaginatedAPI(notion.blocks.children.list, {
    block_id: parentBlockId,
  })) {
    blocks.push(block)
  }

  return blocks;
}

export const getDatabaseWithBlocks = async (event: any) => {
  const blocks = await getDatabaseBlocks(event.id) 
  return {...event, blocks }
}

export const getDatabaseWithParsedBlocks = (event: any) => {
  const parser = NotionBlocksMarkdownParser.getInstance()
  const parsedBlocks = event.blocks ? parser.parse(event.blocks) : []
  console.log("parsedBlocks", parsedBlocks)

  return {...event, parsedBlocks }
}

export const fetchEventsWithBlocks = async (notionEvents: any[]) => {
  const eventsWithBlocksPromises = notionEvents.map(getDatabaseWithBlocks)

  const eventsWithBlocks = await Promise.all(eventsWithBlocksPromises)
  const eventsWithParsedBlocks = eventsWithBlocks.map(getDatabaseWithParsedBlocks)

  return eventsWithParsedBlocks
}