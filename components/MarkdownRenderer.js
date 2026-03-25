import React from 'react';

/**
 * A lightweight Markdown renderer that handles basic bold (**text**) and bullet points (* item)
 * cleanly without external dependencies, ensuring compatibility with Jest/CJS.
 */
export default function MarkdownRenderer({ content, className }) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, idx) => {
        let processedLine = line.trim();
        
        // Handle Bullet Points
        if (processedLine.startsWith('* ') || processedLine.startsWith('- ')) {
          const text = processedLine.substring(2);
          return (
            <ul key={idx} style={{ margin: '4px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
              <li>{parseBold(text)}</li>
            </ul>
          );
        }

        // Handle empty lines
        if (processedLine === '') {
          return <div key={idx} style={{ height: '0.8em' }} />;
        }

        // Regular line
        return <p key={idx} style={{ margin: '0 0 0.8em 0' }}>{parseBold(line)}</p>;
      })}
    </div>
  );
}

function parseBold(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
