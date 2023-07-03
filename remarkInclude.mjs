import fs from "node:fs";
import path from "node:path";
import { visit } from "unist-util-visit";
const remarkEmbedder = () => {
  return (tree) => {
    visit(tree, "paragraph", (paragraphNode, index, parent) => {
      if (paragraphNode.children.length !== 1) {
        return;
      }
      const { children } = paragraphNode;
      const node = children[0];
      if (node.type !== "text") {
        return;
      }
      const m = /^include_str!\("(.*?)"\)/.exec(node.value);
      if (!m) {
        return;
      }
      const ref = m[1];
      try {
        const str = fs.readFileSync(ref, { encoding: "utf-8" });
        const lang = path.extname(ref);
        const code = {
          type: "code",
          lang: lang ? lang.slice(1) : undefined,
          value: str,
        };
        parent.children[index] = code;
        return "skip";
      } catch (err) {
        console.error(err);
      }
    });
    return tree;
  };
};
export default remarkEmbedder;
