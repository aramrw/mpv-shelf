import React from 'react'

export default function NameFromPath({ path }: { path: string }): string {
  if (path.includes("/")) {
    let split = path.split('/');
    return split[split.length - 1];
  } else if (path.includes("\\")) {
    let split = path.split('\\');
    return split[split.length - 1];
  } else {
    return path
  }
}
