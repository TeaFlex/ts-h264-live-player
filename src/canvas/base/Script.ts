
/**
 * Represents a WebGL shader script.
 */
export class Script {

    private constructor(public type: string, public source: string) {}

    static createFromElementId(id: string) {
        const script = document.getElementById(id) as HTMLScriptElement;

        // Didn't find an element with the specified ID, abort.
        if(!script)
            throw `Could not find shader with ID: ${id}`;

        // Walk through the source element's children, building the shader source string.
        let source = "";
        let currentChild = script.firstChild;
        while(currentChild) {
            if (currentChild.nodeType == 3)
                source += currentChild.textContent;
            currentChild = currentChild.nextSibling;
        }

        return new Script(
            script.type,
            source
        );
    }

    static createFromSource(script: string, source: string) {
        return new Script(
            script,
            source
        );
    }
}