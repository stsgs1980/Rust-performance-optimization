import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// No-Unicode Policy v2.1 [C] - block emoji/unicode graphics in UI code
const emojiPattern = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/u;

const noUnicodeRule = {
  meta: {
    type: 'problem',
    docs: { description: 'No-Unicode Policy v2.1: prohibit emoji/unicode graphics in UI code [C]' },
    messages: { noUnicode: 'Unicode graphics prohibited. Use SVG icons (Lucide) instead. Found: "{{ value }}"' },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && emojiPattern.test(node.value)) {
          context.report({ node, messageId: 'noUnicode', data: { value: node.value } });
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (emojiPattern.test(quasi.value.raw)) {
            context.report({ node, messageId: 'noUnicode', data: { value: quasi.value.raw } });
          }
        }
      },
    };
  },
};

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  plugins: {
    'no-unicode-policy': { rules: { 'no-unicode': noUnicodeRule } },
  },
  rules: {
    'no-unicode-policy/no-unicode': 'error',
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "upload/**"]
}];

export default eslintConfig;
