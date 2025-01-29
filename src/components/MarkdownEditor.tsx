"use client";

import { MDXEditor, MDXEditorMethods, headingsPlugin } from "@mdxeditor/editor";
import { FC } from "react";
import '@mdxeditor/editor/style.css'


interface EditorProps {
    markdown: string;
    editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
    onChange: any
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = ({ markdown, editorRef, onChange }) => {
    return (
        <MDXEditor
            onChange={onChange}
            ref={editorRef}
            markdown={markdown}
            plugins={[headingsPlugin()]}
        />
    );
};

export default Editor;