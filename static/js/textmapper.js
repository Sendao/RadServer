class CompressedTrieNode {
    constructor() {
        this.children = new Map(); // Using Map for key order preservation
        this.isEndOfWord = false;
        this.key = ''; // Stores the string from the parent to this node
    }
}

class CompressedTrie {
    constructor() {
        this.root = new CompressedTrieNode();
    }

    insert(word) {
        let node = this.root;
        let i = 0;
        
        while (i < word.length) {
            let child = this.findChildWithPrefix(node, word.slice(i));
            if (child) {
                let commonPrefix = this.getCommonPrefix(word.slice(i), child.key);
                if (commonPrefix.length === child.key.length) {
                    // Move down the tree
                    i += commonPrefix.length;
                    node = child;
                } else {
                    // Split the node
                    let newNode = new CompressedTrieNode();
                    newNode.key = child.key.slice(commonPrefix.length);
                    newNode.children = child.children;
                    newNode.isEndOfWord = child.isEndOfWord;

                    child.key = commonPrefix;
                    child.isEndOfWord = false;
                    child.children.clear();
                    child.children.set(newNode.key, newNode);

                    if (commonPrefix.length === word.slice(i).length) {
                        child.isEndOfWord = true;
                        return;
                    } else {
                        let newLeaf = new CompressedTrieNode();
                        newLeaf.key = word.slice(i + commonPrefix.length);
                        newLeaf.isEndOfWord = true;
                        child.children.set(newLeaf.key, newLeaf);
                        return;
                    }
                }
            } else {
                // Add new node
                let newLeaf = new CompressedTrieNode();
                newLeaf.key = word.slice(i);
                newLeaf.isEndOfWord = true;
                node.children.set(newLeaf.key, newLeaf);
                return;
            }
        }
        node.isEndOfWord = true; // If we've reached here, the word was already in the trie
    }

    findChildWithPrefix(node, prefix) {
        for (let [key, child] of node.children) {
            if (key.startsWith(prefix[0])) return child;
        }
        return null;
    }

    getCommonPrefix(str1, str2) {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) i++;
        return str1.slice(0, i);
    }

    search(word) {
        let node = this.root;
        let i = 0;
        while (node && i < word.length) {
            let child = this.findChildWithPrefix(node, word.slice(i));
            if (child) {
                if (word.slice(i).startsWith(child.key)) {
                    i += child.key.length;
                    node = child;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        return node && node.isEndOfWord;
    }

    startsWith(prefix) {
        let node = this.root;
        let i = 0;
        while (node && i < prefix.length) {
            let child = this.findChildWithPrefix(node, prefix.slice(i));
            if (child) {
                if (prefix.slice(i).startsWith(child.key)) {
                    i += child.key.length;
                    node = child;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        return node !== null;
    }
}

// Usage example:
let trie = new CompressedTrie();
trie.insert("apple");
trie.insert("app");
console.log(trie.search("apple"));   // true
console.log(trie.search("app"));     // true
console.log(trie.startsWith("ap"));  // true

function mapFrequencies(raw)
{
    let freqs = {};
    var i,j;
    var last;
    let min_k = 3;
    for( i=0; i<raw.length; i++ ) {
        let c = raw[i];
        freqs[c] = c in freqs ? freqs[c]+1 : 1;
        if( i == 0 ) {
            last = c;
            continue;
        }
        let ch = last + c;
        last = c;

        let count=1;
        for( j=i+2; j<raw.length; j++ ) {
            let de = raw[j-1] + raw[j];
            if( de != ch ) continue;
            var k;
            for( k=3; k+j<raw.length; k++ ) {
                if( raw.substring(i-1, i+k-1) != raw.substring(j-1, j+k-1) ) {
                    k--;
                    if( k >= min_k ) {
                        freqs[raw.substring(i-1,i+k)] = 1;
                    }
                    break;
                }
            }
        }
    }
    /* don't worry about the official count:
    for( var key in freqs ) {
        if( key.length >= min_k ) {
            // count how many times it occurs formally
            let count=0;
            let pos=-key.length;
            while( (pos=raw.indexOf(key,pos+key.length)) != -1 ) {
                count++;
            }
            freqs[key]=count;
        }
    }*/
    return freqs;
}
function encodeText(raw)
{
    let freqs = mapFrequencies(raw);
    let codes = [];
    let used = new Map();
    let trie = new CompressedTrie();
    for( var key in freqs ) {
        trie.insert(key);
    }

    var i;
    var result = "";
    var buf = "";
    var code;
    for( i=0; i<raw.length; i++ ) {
        if( trie.startsWith(buf + raw[i]) ) {
            buf += raw[i];
        } else {
            if( !used.has(buf) ) {
                code = codes.length;
                used.set(buf, code);
                codes.push(buf);
            } else code = used.get(buf);
            if( result != "" ) result += "," + code;
            else result = code;
            buf = raw[i];
        }
    }
    if( buf != "" ) {
        if( !used.has(buf) ) {
            code = codes.length;
            used.set(buf, code);
            codes.push(buf);
        } else code = used.get(buf);
        if( result != "" ) result += "," + code;
        else result = code;
    }
    console.log(codes);
    return JSON.stringify(codes) + "\n[enc]\n" + result;
}
function decodeText(encoded)
{
    let encparts = encoded.split("\n[enc]\n");
    let codes = JSON.parse(encparts[0]);
    let revmap = {};
    var i;
    for( i=0; i<codes.length; i++ ) {
        revmap[ i ] = codes[i];
    }

    var raw = encparts[1].split(",");
    var result = "";
    for( i=0; i<raw.length; i++ ) {
        result += revmap[raw[i]];
    }
    return result;
}
