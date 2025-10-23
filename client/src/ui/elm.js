import { Assets, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";

/**
 * @callback Component
 * @param {object} props
 * @param {VNode[]} [children]
 * @returns {VNode | null}
 *
 * @callback MountHook
 * @param {Container & {_internalState?: any}} elm
 *
 * @callback UpdateHook
 * @param {VNode} oldVnode
 * @param {VNode} newVnode
 *
 * @callback DestroyHook
 * @param {Container} elm
 *
 * @callback RemoveHook
 * @param {Container} elm
 * @param {() => void} done
 *
 * @typedef {Object} LifecycleHooks
 * @property {MountHook} [mount]
 * @property {UpdateHook} [update]
 * @property {DestroyHook} [destroy]
 * @property {RemoveHook} [remove]
 *
 * @typedef {Object} BaseVNodeProps
 * @property {string | number} key
 * @property {LifecycleHooks} [hook]
 * @property {number} [x = 0]
 * @property {number} [y = 0]
 * @property {number} [alpha = 1]
 * @property {boolean} [visible = true]
 * @property {number | {x: number, y: number}} [scale = 1]
 * @property {number | {x: number, y: number}} [pivot = 0]
 * @property {number} [rotation = 0]
 * @property {object} [componentProps]
 *
 * @typedef {BaseVNodeProps} ContainerProps
 *
 * @typedef {BaseVNodeProps & {
 *   draw: (g: Graphics) => void
 * }} GraphicsProps
 *
 * @typedef {BaseVNodeProps & {
 *   text: string,
 *   style?: TextStyle
 *   anchor?: number | {x: number, y: number}
 * }} TextProps
 *
 * @typedef {BaseVNodeProps & {
 *   texture: string,
 *   anchor?: number | {x: number, y: number},
 *   tint?: number
 * }} SpriteProps
 *
 * @typedef {Object} VNode
 * @property {string | Component} type
 * @property {BaseVNodeProps} props
 * @property {VNode[]} children
 * @property {Container & {_internalState?: object}} [elm]
 * @property {VNode | null} [renderedVnode]
 */

/**
 * Crée un VNode (Hyperscript). C'est le seul moyen de créer des VNodes.
 * @param {string | Component} type - Un type primitif ("container", "sprite"...) ou une fonction Composant.
 * @param {string | number} key
 * @param {object} props - Les propriétés du VNode.
 * @param {VNode | VNode[]} [children] - Les enfants du VNode.
 * @returns {VNode}
 */
export function h(type, key, props, children = []) {
    return {
	type,
	props: {
	    key,
	    ...props || {}
	},
	children: Array.isArray(children) ? children : (children ? [children] : []),
	elm: undefined,
	renderedVnode: undefined,
    }
}

/**
 * @param {Container} elm 
 * @param {BaseVNodeProps} props 
 */
function applyProps(elm, props) {
    elm.x = props.x || 0;
    elm.y = props.y || 0;
    elm.alpha = props.alpha ?? 1;
    elm.visible = props.visible ?? true;
    elm.rotation = props.rotation || 0;
    if (props.pivot) {
	typeof props.pivot === "number" ? elm.pivot.set(props.pivot) : elm.pivot.set(props.pivot.x, props.pivot.y)
    }
    if (props.scale) {
	typeof props.scale === "number" ? elm.scale.set(props.scale) : elm.scale.set(props.scale.x, props.scale.y)
    }
}

/**
 * @param {VNode} vnode 
 * @returns {Container}
 */
function createElm(vnode) {
    if (vnode === null) {
	const placeholder = new Container();
	placeholder.visible = false;
	return placeholder;
    }

    if (typeof vnode.type === "function") {
	const renderedVnode = vnode.type(vnode.props, vnode.children);
	if (renderedVnode !== null) {
	    vnode.renderedVnode = renderedVnode;
	    const elm = createElm(renderedVnode);
	    vnode.elm = elm;
	    return elm;
	}
    }

    /** @type {Container} */
    let elm;

    switch (vnode.type) {
    case "container": {
	const props = /** @type {ContainerProps} */ (vnode.props);
	elm = new Container();
	applyProps(elm, props);
	for (const child of vnode.children) {
	    elm.addChild(createElm(child));
	}
    } break;
    case "graphics": {
	const props = /** @type {GraphicsProps} */ (vnode.props);
	elm = new Graphics();
	applyProps(elm, props);
	if (props.draw) props.draw(/** @type {Graphics} */(elm));
    } break;
    case "text": {
	const props = /** @type {TextProps} */ (vnode.props);
	elm = new Text({text: props.text, style: props.style});
	applyProps(elm, props);
	if (props.anchor) {
	    if (typeof props.anchor === "number") {
		/** @type {Text} */(elm).anchor.set(props.anchor)
	    } else {
		/** @type {Text} */(elm).anchor.set(props.anchor.x, props.anchor.y)
	    }
	}
    } break;
    case "sprite": {
	const props = /** @type {SpriteProps} */ (vnode.props);
	elm = new Sprite(Assets.get(props.texture))
	applyProps(elm, props);
	if (props.anchor) {
	    if (typeof props.anchor === "number") {
		/** @type {Sprite} */(elm).anchor.set(props.anchor)
	    } else {
		/** @type {Sprite} */(elm).anchor.set(props.anchor.x, props.anchor.y)
	    }
	}
	if (props.tint) elm.tint = props.tint;
    } break;
    default:
	throw new Error(`Type de VNode primitif inconnu: ${vnode.type}`);
    }

    vnode.elm = elm;
    if (vnode.props.hook?.mount) {
	vnode.props.hook.mount(elm);
    }

    return elm;
}

/**
 * @param {VNode} vnode1 
 * @param {VNode} vnode2
 * @returns {boolean}
 */
function sameVnode(vnode1, vnode2) {
    return vnode1.props.key === vnode2.props.key && vnode1.type === vnode2.type;
}

/**
 * @param {VNode} vnode
 */
function invokeDestroyHook(vnode) {
    if (vnode.props.hook?.destroy) {
	vnode.props.hook.destroy(/** @type {Container} */(vnode.elm));
    }
    if (vnode.renderedVnode) {
	invokeDestroyHook(vnode.renderedVnode);
    } else if (vnode.children) {
	for (const child of vnode.children) {
	    invokeDestroyHook(child);
	}
    }
}

/**
 * @param {Container} parentElm
 * @param {VNode} vnode
 */
function invokeRemoveHook(parentElm, vnode) {
    invokeDestroyHook(vnode);
    if (vnode.props.hook?.remove) {
	const done = () => parentElm.removeChild(/** @type {Container} */(vnode.elm));
	vnode.props.hook.remove(/** @type {Container} */(vnode.elm), done);
    } else {
	parentElm.removeChild(/** @type {Container} */(vnode.elm));
    }
}

/**
 * @param {VNode} oldVnode
 * @param {VNode} newVnode
 */
function patchVnode(oldVnode, newVnode) {
    const elm = newVnode.elm = oldVnode.elm;

    if (typeof newVnode.type === "function") {
	const oldRendered = /** @type {VNode | null} */(oldVnode.renderedVnode);
	const newRendered = newVnode.type(newVnode.props, newVnode.children);
	newVnode.renderedVnode = newRendered;
	patch(/** @type {Container} */(/** @type {Container} */(elm).parent), oldRendered, newRendered);
	return;
    }

    if (newVnode.props.hook?.update) {
	newVnode.props.hook.update(oldVnode, newVnode);
    }

    applyProps(/** @type {Container} */(elm), newVnode.props);

    switch (newVnode.type) {
    case "container":
	updateChildren(/** @type {Container} */(elm), oldVnode.children, newVnode.children);
	break;
    case "graphics": 
	if (elm instanceof Graphics) {
	    const oldProps = /** @type {GraphicsProps} */ (oldVnode.props);
	    const newProps = /** @type {GraphicsProps} */ (newVnode.props);
	    if (oldProps.draw !== newProps.draw) {
		newProps.draw(/** @type {Graphics} */(elm));
	    }
	}
	break;
    case "text": 
	if (elm instanceof Text) {
	    const oldProps = /** @type {TextProps} */ (oldVnode.props);
	    const newProps = /** @type {TextProps} */ (newVnode.props);
	    if (oldProps.text !== newProps.text) elm.text = newProps.text;
	    if (oldProps.style !== newProps.style) elm.style = /** @type {TextStyle} */(newProps.style);
	    if (oldProps.anchor !== newProps.anchor) {
		if (newProps.anchor) {
		    if (typeof newProps.anchor === "number") {
			elm.anchor.set(newProps.anchor)
		    } else {
			elm.anchor.set(newProps.anchor.x, newProps.anchor.y);
		    }
		}
	    }
	}
	break;
    case "sprite":
	if (elm instanceof Sprite) {
	    const oldProps = /** @type {SpriteProps} */ (oldVnode.props);
	    const newProps = /** @type {SpriteProps} */ (newVnode.props);
	    if (oldProps.texture !== newProps.texture) elm.texture = Assets.get(newProps.texture);
	    if (oldProps.anchor !== newProps.anchor) {
		if (newProps.anchor) {
		    if (typeof newProps.anchor === "number") {
			elm.anchor.set(newProps.anchor)
		    } else {
			elm.anchor.set(newProps.anchor.x, newProps.anchor.y);
		    }
		}
	    }
	    if (oldProps.tint !== newProps.tint) elm.tint = /** @type {number} */(newProps.tint);
	}
	break;
    default:
	throw new Error("Unreachable");
    }
}

/**
 * @param {Container} parentContainer
 * @param {VNode | null} oldVnode
 * @param {VNode | null} newVnode
 * @returns {VNode | null}
 */
export function patch(parentContainer, oldVnode, newVnode) {
    if (newVnode === null) {
	if (oldVnode !== null) {
	    invokeRemoveHook(parentContainer, oldVnode);
	}
	return null;
    }
    if (oldVnode === null) {
	createElm(newVnode);
	parentContainer.addChild(/** @type {Container} */(newVnode.elm));
    } else {
	if (sameVnode(oldVnode, newVnode)) {
	    patchVnode(oldVnode, newVnode);
	} else {
	    // TODO
	    //invokeDestroyHook(oldVnode);
	    createElm(newVnode);
	    parentContainer.addChild(/** @type {Container} */(newVnode.elm));
	    //parentContainer.removeChild(/** @type {Container} */(oldVnode.elm));
	    invokeRemoveHook(parentContainer, oldVnode);
	}
    }
    return newVnode;
}

/**
 * @param {VNode[]} children 
 * @param {number} beginIdx 
 * @param {number} endIdx 
 * @returns {{ [key: string | number]: number }}
 */
function createKeyToOldIdx(children, beginIdx, endIdx) {
    /** @type {{ [key: string | number]: number }} */
    const map = {};
    for (let i = beginIdx; i <= endIdx; ++i) {
	const key = children[i].props.key;
	map[key] = i;
    }
    return map;
}

/**
 * @param {Container} parentElm 
 * @param {VNode[]} oldCh 
 * @param {VNode[]} newCh
 */
function updateChildren(parentElm, oldCh, newCh) {
    let oldStartIdx = 0;
    let newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1;
    let oldStartVnode = oldCh[0];
    let oldEndVnode = oldCh[oldEndIdx];
    let newEndIdx = newCh.length - 1;
    let newStartVnode = newCh[0];
    let newEndVnode = newCh[newEndIdx];
    let oldKeyToIdx = undefined;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
	if (oldStartVnode === null) {
	    oldStartVnode = oldCh[++oldStartIdx];
	} else if (oldEndVnode === null) {
	    oldEndVnode = oldCh[--oldEndIdx];
	} else if (newStartVnode === null) {
	    newStartVnode = newCh[++newStartIdx];
	} else if (newEndVnode === null) {
	    newEndVnode = newCh[--newEndIdx];
	} else if (sameVnode(oldStartVnode, newStartVnode)) {
	    patchVnode(oldStartVnode, newStartVnode);
	    oldStartVnode = oldCh[++oldStartIdx];
	    newStartVnode = newCh[++newStartIdx];
	} else if (sameVnode(oldEndVnode, newEndVnode)) {
	    patchVnode(oldEndVnode, newEndVnode);
	    oldEndVnode = oldCh[--oldEndIdx];
	    newEndVnode = newCh[--newEndIdx];
	} else if (sameVnode(oldStartVnode, newEndVnode)) {
	    patchVnode(oldStartVnode, newEndVnode);
	    parentElm.addChildAt(/** @type {Container} */(oldStartVnode.elm), parentElm.getChildIndex(/** @type {Container} */(oldEndVnode.elm)) + 1);
	    oldStartVnode = oldCh[++oldStartIdx];
	    newEndVnode = newCh[--newEndIdx];
	} else if (sameVnode(oldEndVnode, newStartVnode)) {
	    patchVnode(oldEndVnode, newStartVnode);
	    parentElm.addChildAt(/** @type {Container} */(oldEndVnode.elm), parentElm.getChildIndex(/** @type {Container} */(oldStartVnode.elm)));
	    oldEndVnode = oldCh[--oldEndIdx];
	    newStartVnode = newCh[++newStartIdx];
	} else {
	    if (oldKeyToIdx === undefined) {
		oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
	    }
	    const idxInOld = oldKeyToIdx[newStartVnode.props.key];
	    if (idxInOld === undefined) {
		parentElm.addChildAt(createElm(newStartVnode), parentElm.getChildIndex(/** @type {Container} */(oldStartVnode.elm)))
	    } else {
		const elmToMove = oldCh[idxInOld];
		patchVnode(elmToMove, newStartVnode);
		parentElm.addChildAt(/** @type {Container} */(elmToMove.elm), parentElm.getChildIndex(/** @type {Container} */(oldStartVnode.elm)));
		oldCh[idxInOld] = undefined;
	    }
	    newStartVnode = newCh[++newStartIdx];
	}
    }

    if (oldStartIdx > oldEndIdx) {
	const refIdx = newCh[newEndIdx + 1] ? parentElm.getChildIndex(/** @type {Container} */(newCh[newEndIdx + 1].elm)) : parentElm.children.length;
	for (let i = newStartIdx; i <= newEndIdx; ++i) {
	    parentElm.addChildAt(createElm(newCh[i]), refIdx);
	}
    } else if (newStartIdx > newEndIdx) {
	for (let i = oldStartIdx; i <= oldEndIdx; ++i) {
	    if (oldCh[i]) {
		invokeRemoveHook(parentElm, oldCh[i]);
	    }
	}
    }
}
