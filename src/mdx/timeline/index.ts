import { MDXContent } from 'mdx/types';
import * as Entry01 from './music22/entry.mdx';
import * as Entry02 from './fall22_semester/entry.mdx';
import * as Entry03 from './datagame12/entry.mdx';
import * as Entry04 from './graduation/entry.mdx';

export type EntryType = {
  title: string;
  date: string;
  default: MDXContent
}

const timeline: EntryType[] = [
  Entry01,
  Entry02,
  Entry03,
  Entry04,
];

export default timeline;