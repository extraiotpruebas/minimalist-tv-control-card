/*! Minimalist TV Control Card v4.0.0-dev · MIT · https://github.com/extraiotpruebas/minimalist-tv-control-card */
// src/version.js
var CARD_VERSION = "4.0.0-dev";
// src/tag.js
var DEFAULT_CARD_TAG = "tv-control-card";
var CARD_TAG = DEFAULT_CARD_TAG;
var EDITOR_TAG = `${DEFAULT_CARD_TAG}-editor`;
function tagFromUrl(url) {
	try {
		const tag = new URL(url).searchParams.get("tag");
		return tag && /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag) ? tag : DEFAULT_CARD_TAG;
	} catch {
		return DEFAULT_CARD_TAG;
	}
}
function setCardTag(tag) {
	CARD_TAG = tag;
	EDITOR_TAG = `${tag}-editor`;
}
// node_modules/@lit/reactive-element/css-tag.js
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$3 = globalThis;
var e$5 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s$3 = Symbol();
var o$4 = /* @__PURE__ */ new WeakMap();
var n$4 = class {
	constructor(t, e, o) {
		if (this._$cssResult$ = !0, o !== s$3) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = t, this.t = e;
	}
	get styleSheet() {
		let t = this.o;
		const s = this.t;
		if (e$5 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length;
			e && (t = o$4.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$4.set(s, t));
		}
		return t;
	}
	toString() {
		return this.cssText;
	}
};
var r$3 = (t) => new n$4("string" == typeof t ? t : t + "", void 0, s$3);
var S$1 = (s, o) => {
	if (e$5) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
	else for (const e of o) {
		const o = document.createElement("style"), n = t$3.litNonce;
		void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
	}
};
var c$4 = e$5 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
	let e = "";
	for (const s of t.cssRules) e += s.cssText;
	return r$3(e);
})(t) : t;
// node_modules/@lit/reactive-element/reactive-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var { is: i$5, defineProperty: e$4, getOwnPropertyDescriptor: h$2, getOwnPropertyNames: r$2, getOwnPropertySymbols: o$3, getPrototypeOf: n$3 } = Object, a$1 = globalThis, c$3 = a$1.trustedTypes, l$2 = c$3 ? c$3.emptyScript : "", p$2 = a$1.reactiveElementPolyfillSupport, d$2 = (t, s) => t, u$3 = {
	toAttribute(t, s) {
		switch (s) {
			case Boolean:
				t = t ? l$2 : null;
				break;
			case Object:
			case Array: t = null == t ? t : JSON.stringify(t);
		}
		return t;
	},
	fromAttribute(t, s) {
		let i = t;
		switch (s) {
			case Boolean:
				i = null !== t;
				break;
			case Number:
				i = null === t ? null : Number(t);
				break;
			case Object:
			case Array: try {
				i = JSON.parse(t);
			} catch (t) {
				i = null;
			}
		}
		return i;
	}
}, f$2 = (t, s) => !i$5(t, s), b$1 = {
	attribute: !0,
	type: String,
	converter: u$3,
	reflect: !1,
	useDefault: !1,
	hasChanged: f$2
};
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y$1 = class extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(t, s = b$1) {
		if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
			const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
			void 0 !== h && e$4(this.prototype, t, h);
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: r } = h$2(this.prototype, t) ?? {
			get() {
				return this[s];
			},
			set(t) {
				this[s] = t;
			}
		};
		return {
			get: e,
			set(s) {
				const h = e?.call(this);
				r?.call(this, s), this.requestUpdate(t, h, i);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? b$1;
	}
	static _$Ei() {
		if (this.hasOwnProperty(d$2("elementProperties"))) return;
		const t = n$3(this);
		t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(d$2("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d$2("properties"))) {
			const t = this.properties, s = [...r$2(t), ...o$3(t)];
			for (const i of s) this.createProperty(i, t[i]);
		}
		const t = this[Symbol.metadata];
		if (null !== t) {
			const s = litPropertyMetadata.get(t);
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s);
			void 0 !== i && this._$Eh.set(i, t);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(s) {
		const i = [];
		if (Array.isArray(s)) {
			const e = new Set(s.flat(1 / 0).reverse());
			for (const s of e) i.unshift(c$4(s));
		} else void 0 !== s && i.push(c$4(s));
		return i;
	}
	static _$Eu(t, s) {
		const i = s.attribute;
		return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
	}
	addController(t) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
	}
	removeController(t) {
		this._$EO?.delete(t);
	}
	_$E_() {
		const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
		t.size > 0 && (this._$Ep = t);
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return S$1(t, this.constructor.elementStyles), t;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.());
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i);
	}
	_$ET(t, s) {
		const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
		if (void 0 !== e && !0 === i.reflect) {
			const h = (void 0 !== i.converter?.toAttribute ? i.converter : u$3).toAttribute(s, i.type);
			this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
		}
	}
	_$AK(t, s) {
		const i = this.constructor, e = i._$Eh.get(t);
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u$3;
			this._$Em = e;
			const r = h.fromAttribute(s, t.type);
			this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
		}
	}
	requestUpdate(t, s, i, e = !1, h) {
		if (void 0 !== t) {
			const r = this.constructor;
			if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f$2)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
			this.C(t, s, i);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
		i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (t) {
			Promise.reject(t);
		}
		const t = this.scheduleUpdate();
		return null != t && await t, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (const [t, s] of this._$Ep) this[t] = s;
				this._$Ep = void 0;
			}
			const t = this.constructor.elementProperties;
			if (t.size > 0) for (const [s, i] of t) {
				const { wrapped: t } = i, e = this[s];
				!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
			}
		}
		let t = !1;
		const s = this._$AL;
		try {
			t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
		} catch (s) {
			throw t = !1, this._$EM(), s;
		}
		t && this._$AE(s);
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(t) {
		return !0;
	}
	update(t) {
		this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
	}
	updated(t) {}
	firstUpdated(t) {}
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$2("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$2("finalized")] = /* @__PURE__ */ new Map(), p$2?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$2 = globalThis;
var i$4 = (t) => t;
var s$2 = t$2.trustedTypes;
var e$3 = s$2 ? s$2.createPolicy("lit-html", { createHTML: (t) => t }) : void 0;
var h$1 = "$lit$";
var o$2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n$2 = "?" + o$2;
var r$1 = `<${n$2}>`;
var l$1 = document;
var c$2 = () => l$1.createComment("");
var a = (t) => null === t || "object" != typeof t && "function" != typeof t;
var u$2 = Array.isArray;
var d$1 = (t) => u$2(t) || "function" == typeof t?.[Symbol.iterator];
var f$1 = "[ 	\n\f\r]";
var v$1 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m$1 = />/g;
var p$1 = RegExp(`>|${f$1}(?:([^\\s"'>=/]+)(${f$1}*=${f$1}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t) => (i, ...s) => ({
	_$litType$: t,
	strings: i,
	values: s
});
var b = x(1);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l$1.createTreeWalker(l$1, 129);
function V(t, i) {
	if (!u$2(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return void 0 !== e$3 ? e$3.createHTML(i) : i;
}
var N = (t, i) => {
	const s = t.length - 1, e = [];
	let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v$1;
	for (let i = 0; i < s; i++) {
		const s = t[i];
		let a, u, d = -1, f = 0;
		for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v$1 ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m$1 : void 0 !== u[2] ? (y.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p$1) : void 0 !== u[3] && (c = p$1) : c === p$1 ? ">" === u[0] ? (c = n ?? v$1, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p$1 : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p$1 : c === _ || c === m$1 ? c = v$1 : (c = p$1, n = void 0);
		const x = c === p$1 && t[i + 1].startsWith("/>") ? " " : "";
		l += c === v$1 ? s + r$1 : d >= 0 ? (e.push(a), s.slice(0, d) + h$1 + s.slice(d) + o$2 + x) : s + o$2 + (-2 === d ? i : x);
	}
	return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
};
var S = class S {
	constructor({ strings: t, _$litType$: i }, e) {
		let r;
		this.parts = [];
		let l = 0, a = 0;
		const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
		if (this.el = S.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
			const t = this.el.content.firstChild;
			t.replaceWith(...t.childNodes);
		}
		for (; null !== (r = P.nextNode()) && d.length < u;) {
			if (1 === r.nodeType) {
				if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h$1)) {
					const i = v[a++], s = r.getAttribute(t).split(o$2), e = /([.?@])?(.*)/.exec(i);
					d.push({
						type: 1,
						index: l,
						name: e[2],
						strings: s,
						ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
					}), r.removeAttribute(t);
				} else t.startsWith(o$2) && (d.push({
					type: 6,
					index: l
				}), r.removeAttribute(t));
				if (y.test(r.tagName)) {
					const t = r.textContent.split(o$2), i = t.length - 1;
					if (i > 0) {
						r.textContent = s$2 ? s$2.emptyScript : "";
						for (let s = 0; s < i; s++) r.append(t[s], c$2()), P.nextNode(), d.push({
							type: 2,
							index: ++l
						});
						r.append(t[i], c$2());
					}
				}
			} else if (8 === r.nodeType) if (r.data === n$2) d.push({
				type: 2,
				index: l
			});
			else {
				let t = -1;
				for (; -1 !== (t = r.data.indexOf(o$2, t + 1));) d.push({
					type: 7,
					index: l
				}), t += o$2.length - 1;
			}
			l++;
		}
	}
	static createElement(t, i) {
		const s = l$1.createElement("template");
		return s.innerHTML = t, s;
	}
};
function M$1(t, i, s = t, e) {
	if (i === E) return i;
	let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
	const o = a(i) ? void 0 : i._$litDirective$;
	return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M$1(t, h._$AS(t, i.values), h, e)), i;
}
var R = class {
	constructor(t, i) {
		this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(t) {
		const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l$1).importNode(i, !0);
		P.currentNode = e;
		let h = P.nextNode(), o = 0, n = 0, r = s[0];
		for (; void 0 !== r;) {
			if (o === r.index) {
				let i;
				2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
			}
			o !== r?.index && (h = P.nextNode(), o++);
		}
		return P.currentNode = l$1, e;
	}
	p(t) {
		let i = 0;
		for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
	}
};
var k = class k {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(t, i, s, e) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
	}
	get parentNode() {
		let t = this._$AA.parentNode;
		const i = this._$AM;
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(t, i = this) {
		t = M$1(this, t, i), a(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d$1(t) ? this.k(t) : this._(t);
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB);
	}
	T(t) {
		this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
	}
	_(t) {
		this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l$1.createTextNode(t)), this._$AH = t;
	}
	$(t) {
		const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S.createElement(V(s.h, s.h[0]), this.options)), s);
		if (this._$AH?._$AD === e) this._$AH.p(i);
		else {
			const t = new R(e, this), s = t.u(this.options);
			t.p(i), this.T(s), this._$AH = t;
		}
	}
	_$AC(t) {
		let i = C.get(t.strings);
		return void 0 === i && C.set(t.strings, i = new S(t)), i;
	}
	k(t) {
		u$2(this._$AH) || (this._$AH = [], this._$AR());
		const i = this._$AH;
		let s, e = 0;
		for (const h of t) e === i.length ? i.push(s = new k(this.O(c$2()), this.O(c$2()), this, this.options)) : s = i[e], s._$AI(h), e++;
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
	}
	_$AR(t = this._$AA.nextSibling, s) {
		for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
			const s = i$4(t).nextSibling;
			i$4(t).remove(), t = s;
		}
	}
	setConnected(t) {
		void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
	}
};
var H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(t, i, s, e, h) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings;
		let o = !1;
		if (void 0 === h) t = M$1(this, t, i, 0), o = !a(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
		else {
			const e = t;
			let n, r;
			for (t = h[0], n = 0; n < h.length - 1; n++) r = M$1(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
		}
		o && !e && this.j(t);
	}
	j(t) {
		t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
	}
};
var I = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(t) {
		this.element[this.name] = t === A ? void 0 : t;
	}
};
var L = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== A);
	}
};
var z = class extends H {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), this.type = 5;
	}
	_$AI(t, i = this) {
		if ((t = M$1(this, t, i, 0) ?? A) === E) return;
		const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
		e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
	}
	handleEvent(t) {
		"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
	}
};
var Z = class {
	constructor(t, i, s) {
		this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(t) {
		M$1(this, t);
	}
};
var j$1 = {
	M: h$1,
	P: o$2,
	A: n$2,
	C: 1,
	L: N,
	R,
	D: d$1,
	V: M$1,
	I: k,
	H,
	N: L,
	U: z,
	B: I,
	F: Z
};
var B = t$2.litHtmlPolyfillSupport;
B?.(S, k), (t$2.litHtmlVersions ??= []).push("3.3.3");
var D = (t, i, s) => {
	const e = s?.renderBefore ?? i;
	let h = e._$litPart$;
	if (void 0 === h) {
		const t = s?.renderBefore ?? null;
		e._$litPart$ = h = new k(i.insertBefore(c$2(), t), t, void 0, s ?? {});
	}
	return h._$AI(t), h;
};
// node_modules/lit-element/lit-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s$1 = globalThis;
var i$3 = class extends y$1 {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		const t = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= t.firstChild, t;
	}
	update(t) {
		const r = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return E;
	}
};
i$3._$litElement$ = !0, i$3["finalized"] = !0, s$1.litElementHydrateSupport?.({ LitElement: i$3 });
var o$1 = s$1.litElementPolyfillSupport;
o$1?.({ LitElement: i$3 });
(s$1.litElementVersions ??= []).push("4.2.2");
// src/actions/keys.js
var KEYS = {
	up: {
		label: "Arriba",
		lg: "UP",
		samsung: "KEY_UP",
		roku: "up"
	},
	down: {
		label: "Abajo",
		lg: "DOWN",
		samsung: "KEY_DOWN",
		roku: "down"
	},
	left: {
		label: "Izquierda",
		lg: "LEFT",
		samsung: "KEY_LEFT",
		roku: "left"
	},
	right: {
		label: "Derecha",
		lg: "RIGHT",
		samsung: "KEY_RIGHT",
		roku: "right"
	},
	enter: {
		label: "Enter / OK",
		lg: "ENTER",
		samsung: "KEY_ENTER",
		roku: "select"
	},
	back: {
		label: "Atrás",
		lg: "BACK",
		samsung: "KEY_RETURN",
		roku: "back"
	},
	exit: {
		label: "Salir",
		lg: "EXIT",
		samsung: "KEY_EXIT",
		roku: null
	},
	home: {
		label: "Inicio",
		lg: "HOME",
		samsung: "KEY_HOME",
		roku: "home"
	},
	menu: {
		label: "Menú",
		lg: "MENU",
		samsung: "KEY_MENU",
		roku: null
	},
	info: {
		label: "Info",
		lg: "INFO",
		samsung: "KEY_INFO",
		roku: "info"
	},
	guide: {
		label: "Guía",
		lg: "GUIDE",
		samsung: "KEY_GUIDE",
		roku: null
	},
	apps: {
		label: "Mis apps",
		lg: "MYAPPS",
		samsung: "KEY_APP_LIST",
		roku: null
	},
	search: {
		label: "Buscar",
		lg: null,
		samsung: null,
		roku: "search"
	},
	input_menu: {
		label: "Menú de fuentes",
		lg: "INPUT_HUB",
		samsung: "KEY_SOURCE",
		roku: null
	},
	ch_up: {
		label: "Subir canal",
		lg: "CHANNELUP",
		samsung: "KEY_CHUP",
		roku: "channel_up"
	},
	ch_down: {
		label: "Bajar canal",
		lg: "CHANNELDOWN",
		samsung: "KEY_CHDOWN",
		roku: "channel_down"
	},
	ch_prev: {
		label: "Canal anterior",
		lg: null,
		samsung: "KEY_PRECH",
		roku: null
	},
	vol_up: {
		label: "Subir volumen",
		lg: "VOLUMEUP",
		samsung: "KEY_VOLUP",
		roku: "volume_up"
	},
	vol_down: {
		label: "Bajar volumen",
		lg: "VOLUMEDOWN",
		samsung: "KEY_VOLDOWN",
		roku: "volume_down"
	},
	mute: {
		label: "Silenciar",
		lg: "MUTE",
		samsung: "KEY_MUTE",
		roku: "volume_mute"
	},
	play: {
		label: "Play",
		lg: "PLAY",
		samsung: "KEY_PLAY",
		roku: "play"
	},
	pause: {
		label: "Pausa",
		lg: "PAUSE",
		samsung: "KEY_PAUSE",
		roku: "play"
	},
	stop: {
		label: "Stop",
		lg: "STOP",
		samsung: "KEY_STOP",
		roku: null
	},
	rewind: {
		label: "Rebobinar",
		lg: "REWIND",
		samsung: "KEY_REWIND",
		roku: "reverse"
	},
	ff: {
		label: "Avance rápido",
		lg: "FASTFORWARD",
		samsung: "KEY_FF",
		roku: "forward"
	},
	replay: {
		label: "Repetir",
		lg: null,
		samsung: null,
		roku: "replay"
	},
	record: {
		label: "Grabar",
		lg: "RECORD",
		samsung: "KEY_REC",
		roku: null
	},
	cc: {
		label: "Subtítulos",
		lg: "CC",
		samsung: "KEY_CAPTION",
		roku: null
	},
	asterisk: {
		label: "Asterisco / Herramientas",
		lg: "ASTERISK",
		samsung: "KEY_TOOLS",
		roku: null
	},
	screen_remote: {
		label: "Control en pantalla",
		lg: "SCREEN_REMOTE",
		samsung: null,
		roku: null
	},
	red: {
		label: "Rojo",
		lg: "RED",
		samsung: "KEY_RED",
		roku: null
	},
	green: {
		label: "Verde",
		lg: "GREEN",
		samsung: "KEY_GREEN",
		roku: null
	},
	yellow: {
		label: "Amarillo",
		lg: "YELLOW",
		samsung: "KEY_YELLOW",
		roku: null
	},
	blue: {
		label: "Azul",
		lg: "BLUE",
		samsung: "KEY_CYAN",
		roku: null
	}
};
for (let d = 0; d <= 9; d++) KEYS[`digit_${d}`] = {
	label: String(d),
	lg: String(d),
	samsung: `KEY_${d}`,
	roku: null
};
var HOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"up",
	"down",
	"left",
	"right"
]);
var TV_ONLY_KEYS = /* @__PURE__ */ new Set([
	"vol_up",
	"vol_down",
	"mute"
]);
var CODE_TO_KEY = (() => {
	const map = /* @__PURE__ */ new Map();
	for (const [key, def] of Object.entries(KEYS)) for (const platform of [
		"lg",
		"samsung",
		"roku"
	]) {
		const code = def[platform];
		if (code && !map.has(code)) map.set(code, key);
	}
	return map;
})();
// src/actions/inputs.js
var INPUTS = {
	hdmi1: {
		label: "HDMI 1",
		icon: "mdi:numeric-1-box-multiple-outline",
		lg: { inputId: "HDMI_1" },
		samsung: "ST_HDMI1"
	},
	hdmi2: {
		label: "HDMI 2",
		icon: "mdi:numeric-2-box-multiple-outline",
		lg: { inputId: "HDMI_2" },
		samsung: "ST_HDMI2"
	},
	hdmi3: {
		label: "HDMI 3",
		icon: "mdi:numeric-3-box-multiple-outline",
		lg: { inputId: "HDMI_3" },
		samsung: "ST_HDMI3"
	},
	hdmi4: {
		label: "HDMI 4",
		icon: "mdi:numeric-4-box-multiple-outline",
		lg: { inputId: "HDMI_4" },
		samsung: "ST_HDMI4"
	},
	tv: {
		label: "TV (antena / cable)",
		icon: "mdi:television-classic",
		lg: { app: "com.webos.app.livetv" },
		samsung: "ST_TV"
	}
};
var INPUT_IDS = Object.keys(INPUTS);
function normalizeInputId(value) {
	const str = String(value ?? "").trim();
	if (INPUT_IDS.includes(str)) return str;
	const clean = str.toLowerCase().replace(/[\s_-]/g, "");
	if (INPUT_IDS.includes(clean)) return clean;
	return null;
}
// src/util.js
var has = (obj, key) => typeof key === "string" && Object.hasOwn(obj, key);
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function deepFreeze(obj) {
	if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
		Object.freeze(obj);
		for (const value of Object.values(obj)) deepFreeze(value);
	}
	return obj;
}
function firstDefined(...values) {
	for (const v of values) if (v !== void 0 && v !== null && v !== "") return v;
}
// src/actions/parse.js
var ACTION_TYPES = [
	"key",
	"button",
	"command",
	"source",
	"input",
	"service",
	"sequence",
	"platform",
	"numpad"
];
function stripSsap(uri) {
	return String(uri).trim().replace(/^ssap:\/\//i, "");
}
function parseAction(raw) {
	if (raw === null || raw === void 0) return null;
	if (typeof raw === "object") {
		if (Array.isArray(raw)) return parseAction({
			type: "sequence",
			steps: raw
		});
		if (!ACTION_TYPES.includes(raw.type)) return null;
		switch (raw.type) {
			case "key": return has(KEYS, raw.key) ? {
				type: "key",
				key: raw.key
			} : null;
			case "button": return raw.button ? {
				type: "button",
				button: String(raw.button)
			} : null;
			case "command": {
				if (!raw.command) return null;
				const action = {
					type: "command",
					command: stripSsap(raw.command)
				};
				if (raw.payload && typeof raw.payload === "object") action.payload = { ...raw.payload };
				return action;
			}
			case "source": return raw.source ? {
				type: "source",
				source: String(raw.source)
			} : null;
			case "input": {
				const input = normalizeInputId(raw.input);
				return input ? {
					type: "input",
					input
				} : null;
			}
			case "service":
				if (!raw.service || !String(raw.service).includes(".")) return null;
				return {
					type: "service",
					service: String(raw.service),
					data: { ...raw.data || {} }
				};
			case "sequence": {
				if (!Array.isArray(raw.steps)) return null;
				const steps = raw.steps.map(parseAction).filter((step) => step && step.type !== "numpad");
				if (steps.length === 0) return null;
				const ms = Number(raw.delay);
				return {
					type: "sequence",
					steps,
					delay: raw.delay !== void 0 && Number.isFinite(ms) ? Math.max(0, ms) : 400
				};
			}
			case "platform": {
				const by = {};
				for (const [platform, sub] of Object.entries(raw.by || {})) {
					const parsed = parseAction(sub);
					if (parsed) by[platform] = parsed;
				}
				return Object.keys(by).length ? {
					type: "platform",
					by
				} : null;
			}
			case "numpad": return { type: "numpad" };
		}
		return null;
	}
	const str = String(raw).trim();
	if (str === "" || str.toLowerCase() === "pendiente") return null;
	if (str.toLowerCase() === "numpad") return { type: "numpad" };
	if (/^script\.[a-z0-9_]+$/i.test(str)) return {
		type: "service",
		service: "script.turn_on",
		data: { entity_id: str }
	};
	if (/^scene\.[a-z0-9_]+$/i.test(str)) return {
		type: "service",
		service: "scene.turn_on",
		data: { entity_id: str }
	};
	if (str.startsWith("source:")) {
		const source = str.slice(7).trim();
		return source ? {
			type: "source",
			source
		} : null;
	}
	if (str.startsWith("input:")) return parseAction({
		type: "input",
		input: str.slice(6)
	});
	if (str.startsWith("command:")) {
		const command = stripSsap(str.slice(8));
		return command ? {
			type: "command",
			command
		} : null;
	}
	if (str.startsWith("key:")) return parseAction({
		type: "key",
		key: str.slice(4).trim()
	});
	if (has(KEYS, str)) return {
		type: "key",
		key: str
	};
	const key = CODE_TO_KEY.get(str);
	if (key) return {
		type: "key",
		key
	};
	return {
		type: "button",
		button: str
	};
}
function resolveForPlatform(action, platformId) {
	if (!action) return null;
	if (action.type !== "platform") return action;
	return action.by[platformId] || action.by.default || null;
}
function isHoldable(action) {
	return !!action && action.type === "key" && HOLDABLE_KEYS.has(action.key);
}
// src/config/catalogs.js
var SOURCES = [
	{
		id: "netflix",
		name: "Netflix",
		icon: "mdi:netflix",
		service: "Netflix",
		rokuSource: "Netflix",
		accent: "#e50914"
	},
	{
		id: "disney",
		name: "Disney+",
		icon: "phu:disney-plus",
		service: "Disney+",
		rokuSource: "Disney Plus",
		accent: "#1f5bff"
	},
	{
		id: "prime",
		name: "Prime Video",
		icon: "phu:prime-video",
		service: "Prime Video",
		rokuSource: "Prime Video",
		accent: "#00a8e1"
	},
	{
		id: "YouTube",
		name: "YouTube",
		icon: "mdi:youtube",
		service: "YouTube",
		rokuSource: "YouTube",
		accent: "#ff0033"
	},
	{
		id: "appletv",
		name: "Apple TV",
		icon: "phu:apple-tv",
		service: "Apple TV",
		rokuSource: "Apple TV",
		accent: "#a1a6ad"
	},
	{
		id: "hbomax",
		name: "Max",
		icon: "phu:hbo-max",
		service: "Max",
		rokuSource: "Max",
		accent: "#3355ff"
	},
	{
		id: "paramount",
		name: "Paramount+",
		icon: "phu:paramount-plus",
		service: "Paramount+",
		rokuSource: "Paramount Plus",
		accent: "#0064ff"
	},
	{
		id: "dazn",
		name: "DAZN",
		icon: "phu:dazn",
		service: "DAZN",
		rokuSource: "DAZN Live Sports Streaming",
		accent: "#e8ff1a"
	},
	{
		id: "universal",
		name: "Universal+",
		icon: "mdi:earth",
		service: "Universal+",
		rokuSource: "Universal+",
		accent: null
	},
	{
		id: "spotify",
		name: "Spotify",
		icon: "mdi:spotify",
		service: "Spotify",
		rokuSource: "Spotify",
		accent: "#1db954"
	},
	{
		id: "crunchyroll",
		name: "Crunchyroll",
		icon: "mdi:alpha-c-circle",
		service: "Crunchyroll",
		rokuSource: "Crunchyroll",
		accent: "#f47521"
	},
	{
		id: "twitch",
		name: "Twitch",
		icon: "mdi:twitch",
		service: "Twitch",
		rokuSource: "Twitch",
		accent: "#9146ff"
	},
	{
		id: "fubo",
		name: "Fubo",
		icon: "mdi:alpha-f-circle",
		service: null,
		rokuSource: "Fubo: Watch Live TV & Sports",
		accent: "#fa4616"
	},
	{
		id: "roku",
		name: "Roku",
		icon: "phu:roku-ultra",
		service: "Roku OTT",
		alternates: ["Roku OTT", "Roku"],
		rokuSource: null,
		accent: "#6f1ab1"
	},
	{
		id: "hdmi1",
		name: "HDMI 1",
		icon: "mdi:hdmi-port",
		service: "HDMI 1",
		input: "hdmi1",
		rokuSource: null,
		accent: null
	},
	{
		id: "hdmi2",
		name: "HDMI 2",
		icon: "mdi:hdmi-port",
		service: "HDMI 2",
		input: "hdmi2",
		rokuSource: null,
		accent: null
	},
	{
		id: "hdmi3",
		name: "HDMI 3",
		icon: "mdi:hdmi-port",
		service: "HDMI 3",
		input: "hdmi3",
		rokuSource: null,
		accent: null
	},
	{
		id: "hdmi4",
		name: "HDMI 4",
		icon: "mdi:hdmi-port",
		service: "HDMI 4",
		input: "hdmi4",
		rokuSource: null,
		accent: null
	}
];
var SOURCES_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
var DEFAULT_STREAMING = [
	"netflix",
	"disney",
	"YouTube",
	"appletv"
];
var DIRECTIONS = [
	"up",
	"left",
	"right",
	"down"
];
var NUMPAD_DIGITS = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9
];
function pad(...entries) {
	const result = {};
	DIRECTIONS.forEach((dir, i) => {
		const [icon, action] = entries[i] || [];
		result[dir] = {
			icon: icon || null,
			action: parseAction(action)
		};
	});
	return result;
}
var FIXED_MODES = {
	menu: {
		label: "Menú",
		icon: "mdi:menu-open",
		pad: pad(["mdi:home", "home"], ["mdi:menu", "menu"], ["mdi:exit-to-app", "exit"], ["mdi:undo-variant", "back"])
	},
	busqueda: {
		label: "Canales",
		icon: "mdi:television-classic",
		pad: pad(["mdi:plus-box", "ch_up"], ["mdi:hdmi-port", "input_menu"], ["mdi:format-list-numbered", "guide"], ["mdi:minus-box", "ch_down"])
	},
	audio: {
		label: "Audio",
		icon: "mdi:volume-high",
		pad: pad(["mdi:volume-plus", "vol_up"], ["mdi:volume-off", "mute"], ["mdi:surround-sound", null], ["mdi:volume-minus", "vol_down"])
	},
	fuentes: {
		label: "Fuentes",
		icon: "mdi:television-shimmer",
		pad: pad([INPUTS.hdmi1.icon, "input:hdmi1"], [INPUTS.hdmi2.icon, "input:hdmi2"], [INPUTS.hdmi3.icon, "input:hdmi3"], [INPUTS.hdmi4.icon, "input:hdmi4"])
	},
	info: {
		label: "Información",
		icon: "mdi:information-variant-circle-outline",
		pad: pad(["mdi:television-guide", "guide"], ["mdi:information-slab-circle-outline", "info"], ["mdi:apps", "apps"], ["mdi:tools", "asterisk"])
	}
};
var MODE_ALIASES = { navegacion: "menu" };
var RESERVED_MODES = /* @__PURE__ */ new Set(["text", "amplificador"]);
var CUSTOM_MODE_IDS = [
	"custom1",
	"custom2",
	"custom3"
];
var DEFAULT_PAD = pad(["mdi:chevron-up", "up"], ["mdi:chevron-left", "left"], ["mdi:chevron-right", "right"], ["mdi:chevron-down", "down"]);
var DEFAULT_BUTTONS = {
	top_left: {
		icon: "mdi:exit-to-app",
		action: "exit"
	},
	power: {
		icon: "mdi:power",
		action: null
	},
	center: {
		icon: null,
		action: "enter"
	},
	back: {
		icon: "mdi:undo-variant",
		action: "back"
	},
	home: {
		icon: "mdi:home",
		action: "home"
	},
	exit: {
		icon: "mdi:exit-to-app",
		action: "exit"
	},
	menu: {
		icon: "mdi:menu",
		action: "menu"
	}
};
var BOTTOM_BUTTONS = [
	"back",
	"home",
	"exit",
	"menu"
];
[
	KEYS,
	INPUTS,
	SOURCES,
	FIXED_MODES,
	DEFAULT_PAD,
	DEFAULT_BUTTONS
].forEach(deepFreeze);
// src/card/logic.js
function tvStatus(stateObj) {
	if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown") return "unavailable";
	return stateObj.state === "off" || stateObj.state === "standby" ? "off" : "on";
}
var StateWaiters = class {
	constructor() {
		this._pending = /* @__PURE__ */ new Set();
	}
	wait(hass, entityId, predicate, timeoutMs) {
		const test = (h) => {
			const st = h?.states?.[entityId];
			try {
				return !!st && !!predicate(st);
			} catch {
				return false;
			}
		};
		if (test(hass)) return Promise.resolve(true);
		return new Promise((resolve) => {
			const waiter = {
				test,
				finish: (ok) => {
					clearTimeout(waiter.timer);
					this._pending.delete(waiter);
					resolve(ok);
				}
			};
			waiter.timer = setTimeout(() => waiter.finish(false), timeoutMs);
			this._pending.add(waiter);
		});
	}
	check(hass) {
		for (const waiter of [...this._pending]) if (waiter.test(hass)) waiter.finish(true);
	}
	cancelAll() {
		for (const waiter of [...this._pending]) waiter.finish(false);
	}
	get size() {
		return this._pending.size;
	}
};
var storage = {
	get(key) {
		try {
			return globalThis.localStorage?.getItem(key) ?? null;
		} catch {
			return null;
		}
	},
	set(key, value) {
		try {
			globalThis.localStorage?.setItem(key, String(value));
		} catch {}
	}
};
var TIMING = Object.freeze({
	holdDelay: 400,
	holdInterval: 250,
	holdMaxRepeats: 40,
	powerOn: 2e4,
	powerOff: 1e4,
	sourceConfirm: 6e3
});
var ROKU_ACCENT = "#6f1ab1";
var TV_MODES = /* @__PURE__ */ new Set(["audio", "fuentes"]);
function routeAction(action, { tv, rokuMode, mode }) {
	const tvDevice = {
		platform: tv.platform,
		entity: tv.entity
	};
	const companion = tv.companion;
	if (!action || !rokuMode || !companion?.remote || TV_MODES.has(mode)) return tvDevice;
	const companionDevice = {
		platform: companion.platform,
		entity: companion.entity,
		remote: companion.remote
	};
	if (action.type === "platform") return has(action.by, companion.platform) ? companionDevice : tvDevice;
	if (action.type === "sequence") {
		const ctx = {
			tv,
			rokuMode,
			mode
		};
		return action.steps.every((step) => routeAction(step, ctx).entity === companion.entity) ? companionDevice : tvDevice;
	}
	if (action.type === "key" && !TV_ONLY_KEYS.has(action.key) && KEYS[action.key][companion.platform]) return companionDevice;
	return tvDevice;
}
var normSource = (s) => String(s ?? "").trim().toLowerCase();
function sourceMatches(stateObj, candidates, preferAppName = false) {
	const attrs = stateObj?.attributes ?? {};
	const current = normSource(preferAppName ? attrs.app_name || attrs.source : attrs.source);
	return current !== "" && candidates.some((c) => normSource(c) === current);
}
function resolveSourceName(stateObj, candidates) {
	const list = stateObj?.attributes?.source_list;
	if (Array.isArray(list)) for (const candidate of candidates) {
		const match = list.find((s) => normSource(s) === normSource(candidate));
		if (match) return match;
	}
	return candidates[0];
}
function describeNow({ status, busy, roku, hasCompanion, tvState, rokuState, streaming }) {
	const blank = {
		sub: "",
		accent: null,
		sourceId: null
	};
	if (busy) return {
		...blank,
		title: busy,
		icon: "mdi:television"
	};
	if (status === "unavailable") return {
		...blank,
		title: "Sin conexión",
		sub: "Revisa que la TV esté conectada a la red.",
		icon: "mdi:wifi-off"
	};
	if (status === "off") return {
		...blank,
		title: "Apagada",
		icon: "mdi:television-off"
	};
	const sub = hasCompanion ? roku ? "En el Roku" : "En la TV" : "";
	const source = roku ? SOURCES.find((s) => s.rokuSource && sourceMatches(rokuState, [s.rokuSource], true)) : SOURCES.find((s) => s.service && sourceMatches(tvState, s.alternates ?? [s.service]));
	if (source) {
		const slot = streaming.find((sl) => sl.source.id === source.id);
		return {
			title: source.name,
			sub,
			icon: slot?.icon ?? source.icon,
			accent: slot?.accent ?? source.accent ?? (roku ? ROKU_ACCENT : null),
			sourceId: source.id
		};
	}
	const attrs = (roku ? rokuState : tvState)?.attributes ?? {};
	const raw = roku ? attrs.app_name || attrs.source : attrs.source;
	return {
		title: raw || (roku ? "Roku" : "Encendida"),
		sub,
		icon: roku ? "mdi:remote-tv" : /hdmi/i.test(raw ?? "") ? "mdi:hdmi-port" : "mdi:television-play",
		accent: roku ? ROKU_ACCENT : null,
		sourceId: null
	};
}
function resolvePalette({ palettes, theme, roku, appRef, rokuRef, cardRef }) {
	const levels = [
		appRef,
		roku ? rokuRef : null,
		cardRef
	];
	for (const ref of levels) {
		const name = ref?.[theme];
		if (name && Object.hasOwn(palettes, name)) return palettes[name];
	}
	return null;
}
function paletteTokens(palette) {
	const t = {};
	if (!palette) return t;
	const { base, background, button, text, accent, on } = palette;
	const dark = base === "dark";
	if (background) {
		t["--tv-surface"] = background;
		t["--tv-surface-top"] = `color-mix(in srgb, ${background} ${dark ? 95 : 55}%, #fff)`;
	}
	if (button) {
		t["--tv-raised"] = dark ? `color-mix(in srgb, ${button} 75%, transparent)` : button;
		t["--tv-raised-2"] = dark ? `color-mix(in srgb, ${button} 40%, transparent)` : `color-mix(in srgb, ${button} 80%, var(--tv-surface))`;
		t["--tv-thumb"] = button;
	}
	if (text) {
		t["--tv-ink"] = text;
		t["--tv-ink-2"] = `color-mix(in srgb, ${text} 64%, var(--tv-surface))`;
		t["--tv-line"] = `color-mix(in srgb, ${text} ${dark ? 10 : 13}%, transparent)`;
	}
	if (accent) {
		t["--tv-accent-default"] = accent;
		t["--tv-blob"] = `color-mix(in srgb, ${accent} 60%, ${dark ? "#000" : "#fff"})`;
	}
	if (on) t["--tv-on"] = on;
	return t;
}
// src/card/styles.js
var CARD_CSS = `
:host { display: block; }
* { box-sizing: border-box; }
.card [hidden] { display: none !important; }

ha-card.card {
  display: block; height: 100%; overflow: hidden; container-type: inline-size;
  border: none; border-radius: 28px;
  background: var(--tv-bg); color: var(--tv-ink); box-shadow: var(--tv-card-shadow);
  font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  --tv-accent: var(--tv-accent-default);
  --tv-glow: #dce6f5;
  transition: background 0.8s;
}
:where(.card) button {
  appearance: none; border: 0; margin: 0; padding: 0; background: none; color: inherit; font: inherit;
  cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; touch-action: manipulation;
}
.card button:focus-visible { outline: 2px solid var(--tv-accent); outline-offset: 2px; }
.card button:disabled { cursor: default; }

.body {
  position: relative; isolation: isolate; display: grid; gap: 18px; padding: 22px;
  grid-template-areas: "head" "screen" "apps" "pad" "modes" "keys";
}

.head { grid-area: head; display: grid; grid-auto-flow: column; grid-template-columns: minmax(0, 1fr); grid-auto-columns: auto; align-items: center; gap: 10px; }
.tv-name { display: flex; align-items: center; gap: 2px; min-width: 0; justify-self: start; font-size: 19px; font-weight: 600; letter-spacing: -0.015em; cursor: default; }
.tv-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chevron { display: none; --mdc-icon-size: 18px; opacity: 0.5; }
.card.multi .tv-name { cursor: pointer; }
.card.multi .chevron { display: block; }
.switch { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; font-size: 13px; font-weight: 500; }
.switch button { height: 32px; padding: 0 13px; border-radius: 999px; color: var(--tv-ink-2); }
.switch button[aria-pressed="true"] { color: var(--tv-ink); }
.round { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: var(--tv-ink-2); --mdc-icon-size: 21px; }

.picker {
  position: absolute; z-index: 5; top: 70px; left: 14px; width: min(calc(100% - 28px), 320px);
  display: grid; gap: 2px; padding: 6px; max-height: 60%; overflow: auto;
  border-radius: 20px; transform-origin: 28px 0;
  animation: tv-pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
.picker-item {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px;
  min-height: 48px; padding: 6px 12px 6px 6px; border-radius: 14px; text-align: start;
  font-size: 15px; font-weight: 500; color: var(--tv-ink-2); transition: background 0.15s, color 0.15s;
}
.picker-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-item .tv-ico { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; --mdc-icon-size: 20px; }
.picker-item .check { visibility: hidden; --mdc-icon-size: 18px; }
.picker-item.active { color: var(--tv-ink); }
.picker-item.active .check { visibility: visible; }
@media (hover: hover) { .picker-item:not(.active):hover { color: var(--tv-ink); background: color-mix(in srgb, var(--tv-ink) 5%, transparent); } }

.screen { grid-area: screen; position: relative; isolation: isolate; margin-bottom: 6px; }
.screen::before {
  content: ""; position: absolute; inset: 18% 6% -16%; z-index: -1; border-radius: 40%;
  background: var(--tv-glow); filter: blur(30px); opacity: 0.5;
  transition: opacity 0.8s ease, background-color 0.8s ease;
}
.card:not([data-status="on"]) .screen::before { opacity: 0; }
.glass {
  position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px;
  min-height: 108px; padding: 18px 22px; border-radius: 20px; color: #f3f5f8; overflow: hidden;
  background: linear-gradient(160deg, #171a1f, #050608 58%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.1), 0 14px 30px -16px rgb(0 0 0 / 0.55);
}
.glass::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.055) 41%, transparent 64%); }
.now-icon { --mdc-icon-size: 36px; color: var(--tv-glow); transition: color 0.8s; }
.card:not([data-status="on"]) .now-icon { color: rgb(243 245 248 / 0.35); }
.now-text { min-width: 0; display: grid; justify-items: start; }
.now-title { max-width: 100%; font-size: 23px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.now-sub { font-size: 13px; color: rgb(243 245 248 / 0.55); margin-top: 3px; }
.now-sub:empty { display: none; }
.card[data-busy="true"] .now-title { animation: tv-pulse 1.4s ease-in-out infinite; }

.apps { grid-area: apps; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.app { position: relative; display: grid; place-items: center; height: 54px; color: var(--tv-ink-2); --mdc-icon-size: 28px; }
.app.active { color: var(--tv-accent); }
.app.loading ha-icon { animation: tv-spin 0.9s linear infinite; }

.pad { grid-area: pad; position: relative; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; }
.dir { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; }
.dir.up    { clip-path: polygon(0 0, 100% 0, 50% 50%);       align-items: flex-start; padding-top: 11%; }
.dir.down  { clip-path: polygon(0 100%, 100% 100%, 50% 50%); align-items: flex-end; padding-bottom: 11%; }
.dir.left  { clip-path: polygon(0 0, 0 100%, 50% 50%);       justify-content: flex-start; padding-left: 11%; }
.dir.right { clip-path: polygon(100% 0, 100% 100%, 50% 50%); justify-content: flex-end; padding-right: 11%; }
.dir.empty { pointer-events: none; }
.dir.empty ha-icon { opacity: 0.35; }
.dir:is(.pressed, :active) { color: var(--tv-ink); }
.dir.up    { --tv-press-at: 50% 0%;   --tv-press-size: 40% 29%; }
.dir.down  { --tv-press-at: 50% 100%; --tv-press-size: 40% 29%; }
.dir.left  { --tv-press-at: 0% 50%;   --tv-press-size: 29% 40%; }
.dir.right { --tv-press-at: 100% 50%; --tv-press-size: 29% 40%; }
.ok { position: absolute; z-index: 2; inset: 31%; border-radius: 50%; display: grid; place-items: center; font-size: 15px; font-weight: 600; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: color 0.3s, transform 0.12s; }
.ok > span { grid-area: 1 / 1; position: relative; display: grid; place-items: center; transition: opacity 0.3s ease, transform 0.3s ease; }
.ok-face ha-icon:not([icon]) { display: none; }
.ok-face ha-icon[icon] + span { display: none; }
.ok-power { --mdc-icon-size: 32px; opacity: 0; transform: scale(0.7); }
.ok::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--tv-cta-bg); box-shadow: var(--tv-cta-shadow); opacity: 0; transition: opacity 0.3s ease; }

.modes { grid-area: modes; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
.modes:empty { display: none; }
.mode { display: flex; align-items: center; justify-content: center; gap: 7px; height: 44px; min-width: 0; font-size: 14px; font-weight: 500; color: var(--tv-ink-2); --mdc-icon-size: 19px; }
.mode span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mode[aria-checked="true"] { color: var(--tv-ink); }

.keys { grid-area: keys; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.key { display: grid; place-items: center; height: 50px; color: var(--tv-ink-2); --mdc-icon-size: 24px; }

.numpad { grid-area: pad; display: none; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 10px; }
.card[data-numpad="true"] .numpad { display: grid; animation: tv-pop 0.18s ease-out; }
.card[data-numpad="true"] .pad { display: none; }
.num { height: auto; min-height: 0; font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--tv-ink); }

.toast {
  position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 6;
  padding: 10px 14px; border-radius: 12px; background: rgb(10 12 16 / 0.88); color: #fff;
  font-size: 0.85rem; text-align: center;
  opacity: 0; transform: translateY(8px); transition: opacity 0.2s, transform 0.2s; pointer-events: none;
}
.toast.show { opacity: 1; transform: none; }

@container (max-width: 340px) {
  .body { padding: 16px; gap: 14px; }
  .mode span { display: none; }
  .round { width: 38px; height: 38px; }
  .picker { top: 60px; left: 10px; width: calc(100% - 20px); }
}
@container (min-width: 600px) {
  .body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 36px; align-items: center; padding: 26px;
    grid-template-areas: "head pad" "screen pad" "apps pad" "modes pad" "keys pad";
    grid-template-rows: auto auto auto auto 1fr;
  }
  .pad, .numpad { width: min(100%, 310px); }
  .keys { align-self: end; }
}
@container (min-width: 860px) { .pad, .numpad { width: min(100%, 360px); } }

.card[data-style="relieve"] {
  --tv-surface: #eef1f5; --tv-surface-top: #f5f7fa; --tv-raised: #ffffff; --tv-raised-2: #f6f8fa; --tv-thumb: #ffffff;
  --tv-ink: #1b1f25; --tv-ink-2: #565e69; --tv-line: #d9dee5; --tv-track: #e1e5eb; --tv-hi: #ffffff;
  --tv-shadow: rgb(25 35 55 / 0.16); --tv-shadow-2: rgb(25 35 55 / 0.07); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 45%);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -28px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="relieve"][data-theme="dark"] {
  --tv-surface: #16181c; --tv-surface-top: #1c1f24; --tv-raised: rgb(255 255 255 / 0.075); --tv-raised-2: rgb(255 255 255 / 0.03); --tv-thumb: rgb(255 255 255 / 0.14);
  --tv-ink: #eef0f3; --tv-ink-2: #9aa1ab; --tv-line: rgb(255 255 255 / 0.09); --tv-track: rgb(0 0 0 / 0.35); --tv-hi: rgb(255 255 255 / 0.12);
  --tv-shadow: rgb(0 0 0 / 0.6); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg: radial-gradient(120% 50% at 50% 0%, color-mix(in srgb, var(--tv-glow) 9%, transparent), transparent 70%), linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 50%);
}
.card[data-style="relieve"] :is(.round, .app, .key) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); border-radius: 16px;
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 6px 14px -8px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="relieve"] .round { border-radius: 50%; }
.card[data-style="relieve"][data-theme="dark"] :is(.round, .app, .key, .pad) { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
.card[data-style="relieve"] :is(.round, .app, .key):is(.pressed, :active) { transform: scale(0.97); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1px var(--tv-line); }
.card[data-style="relieve"] .app.active { box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1.5px currentColor, 0 8px 18px -8px currentColor; }
.card[data-style="relieve"] .switch { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .switch button[aria-pressed="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }
.card[data-style="relieve"] .pad {
  background: radial-gradient(circle at 50% 30%, var(--tv-raised), var(--tv-raised-2) 75%);
  box-shadow: inset 0 0 0 1px var(--tv-line), inset 0 -10px 24px -14px var(--tv-shadow), 0 16px 32px -18px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="relieve"] .pad::before {
  content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  --tick: color-mix(in srgb, var(--tv-ink-2) 45%, transparent);
  background:
    linear-gradient(var(--tick), var(--tick)) 50% 3.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 50% 96.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 3.5% 50% / 10px 2px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 96.5% 50% / 10px 2px no-repeat;
}
.card[data-style="relieve"] .dir::after { content: ""; position: absolute; background: var(--tv-accent); border-radius: 2px; opacity: 0; transition: opacity 0.25s; box-shadow: 0 0 10px 1px var(--tv-accent); }
.card[data-style="relieve"] .dir.up::after    { top: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.down::after  { bottom: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.left::after  { left: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir.right::after { right: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir:is(.pressed, :active)::after { opacity: 1; }
.card[data-style="relieve"] .dir { --tv-press: 26%; --tv-press-mid: 10%; }
.card[data-style="relieve"] .ok { background: linear-gradient(180deg, var(--tv-raised-2), var(--tv-raised)); box-shadow: inset 0 2px 6px -2px var(--tv-shadow), 0 0 0 1px var(--tv-line), 0 1px 0 var(--tv-hi); }
.card[data-style="relieve"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 3px 8px -2px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="relieve"] .modes { background: var(--tv-track); border-radius: 16px; padding: 4px; box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .mode { border-radius: 12px; height: 40px; }
.card[data-style="relieve"] .mode[aria-checked="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 8px -3px var(--tv-shadow); }
.card[data-style="relieve"] .picker {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), var(--tv-surface-top);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 4px 10px -6px var(--tv-shadow-2), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="relieve"] .picker-item .tv-ico { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active .tv-ico { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }

.card[data-style="halo"] {
  --tv-surface: #f0f2f6; --tv-raised: #ffffff; --tv-ink: #1b1f25; --tv-ink-2: #555d68; --tv-line: #d8dde4;
  --tv-hi: #ffffff; --tv-shadow: rgb(25 35 55 / 0.15); --tv-shadow-2: rgb(25 35 55 / 0.05); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: var(--tv-surface);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -30px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="halo"][data-theme="dark"] {
  --tv-surface: #121418; --tv-raised: rgb(255 255 255 / 0.06); --tv-ink: #eef0f3; --tv-ink-2: #99a0aa; --tv-line: rgb(255 255 255 / 0.1);
  --tv-hi: rgb(255 255 255 / 0.14); --tv-shadow: rgb(0 0 0 / 0.7); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg:
    radial-gradient(70% 40% at 75% 55%, color-mix(in srgb, var(--tv-glow) 10%, transparent), transparent 70%),
    radial-gradient(90% 45% at 20% 0%, color-mix(in srgb, var(--tv-glow) 8%, transparent), transparent 70%),
    var(--tv-surface);
}
.card[data-style="halo"] :is(.round, .key, .app) {
  background: var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="halo"] .key { width: 52px; height: 52px; justify-self: center; border-radius: 50%; }
.card[data-style="halo"] .num { width: auto; height: 100%; aspect-ratio: 1; }
.card[data-style="halo"] .app { border-radius: 18px; }
.card[data-style="halo"] .app.active::after { content: ""; position: absolute; bottom: 7px; width: 16px; height: 3px; border-radius: 3px; background: currentColor; }
.card[data-style="halo"][data-theme="dark"] :is(.round, .key, .app, .switch, .modes) { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }
.card[data-style="halo"] :is(.round, .key, .app):is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="halo"] .switch { background: var(--tv-raised); box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .pad {
  background: radial-gradient(circle at 50% 40%, var(--tv-raised), transparent 80%), var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 18px 40px -22px var(--tv-shadow);
}
.card[data-style="halo"] .pad::before {
  content: ""; position: absolute; inset: 0; z-index: 1; border-radius: 50%; pointer-events: none;
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tv-accent) 55%, transparent), inset 0 0 22px -6px color-mix(in srgb, var(--tv-accent) 60%, transparent);
  opacity: 0; transition: opacity 0.8s ease;
}
.card[data-style="halo"][data-status="on"] .pad::before { opacity: 1; }
.card[data-style="halo"] .dir { border-radius: 50%; }
.card[data-style="halo"] .dir:is(.pressed, :active) { box-shadow: inset 0 0 0 4px var(--tv-accent), inset 0 0 30px -4px var(--tv-accent); }
.card[data-style="halo"] .ok { background: var(--tv-surface); box-shadow: 0 0 0 1px var(--tv-line), inset 0 2px 8px -3px var(--tv-shadow); }
.card[data-style="halo"][data-theme="dark"] .ok { background: rgb(0 0 0 / 0.25); }
.card[data-style="halo"] .ok:is(.pressed, :active) { box-shadow: 0 0 0 2px var(--tv-accent), inset 0 2px 8px -3px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="halo"] .modes { background: var(--tv-raised); border-radius: 999px; padding: 4px; box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .mode { border-radius: 999px; height: 40px; }
.card[data-style="halo"] .mode[aria-checked="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .picker {
  border-radius: 26px;
  background: linear-gradient(var(--tv-raised), var(--tv-raised)), var(--tv-surface);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="halo"] .picker-item { border-radius: 999px; }
.card[data-style="halo"] .picker-item .tv-ico { box-shadow: inset 0 0 0 1px var(--tv-line); }
.card[data-style="halo"] .picker-item.active { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .picker-item.active .tv-ico { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tv-surface) 30%, transparent); }
.card[data-style="halo"][data-theme="dark"] .picker { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }

.card[data-style="cristal"] {
  --tv-surface: #e9edf3; --tv-raised: rgb(255 255 255 / 0.62); --tv-raised-2: rgb(255 255 255 / 0.35); --tv-hi: rgb(255 255 255 / 0.95);
  --tv-ink: #1b1f25; --tv-ink-2: #545c67; --tv-line: rgb(30 45 70 / 0.1); --tv-shadow: rgb(30 45 70 / 0.22); --tv-on: #1f9d63;
  --tv-accent-default: var(--tv-ink); --tv-blob: #9fb7ff;
  --tv-bg:
    radial-gradient(55% 38% at 18% 8%, color-mix(in srgb, var(--tv-glow) 22%, transparent), transparent 72%),
    radial-gradient(50% 45% at 92% 92%, color-mix(in srgb, var(--tv-blob) 28%, transparent), transparent 72%),
    radial-gradient(45% 35% at 85% 30%, color-mix(in srgb, var(--tv-glow) 12%, transparent), transparent 70%),
    var(--tv-surface);
  --tv-card-shadow: 0 1px 2px rgb(30 45 70 / 0.06), 0 28px 56px -32px var(--tv-shadow);
}
.card[data-style="cristal"][data-theme="dark"] {
  --tv-surface: #0d0f13; --tv-raised: rgb(255 255 255 / 0.07); --tv-raised-2: rgb(255 255 255 / 0.025); --tv-hi: rgb(255 255 255 / 0.2);
  --tv-ink: #f0f2f5; --tv-ink-2: #a1a8b2; --tv-line: rgb(255 255 255 / 0.08); --tv-shadow: rgb(0 0 0 / 0.75); --tv-on: #64e3a6;
  --tv-accent-default: #dce6f5; --tv-blob: color-mix(in srgb, var(--tv-glow) 45%, #3d5cff);
  --tv-card-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 28px 56px -32px var(--tv-shadow);
}
.card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .numpad) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2));
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 12px 28px -16px var(--tv-shadow);
}
.card[data-style="cristal"] .round { transition: transform 0.12s; }
.card[data-style="cristal"] .round:is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="cristal"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="cristal"] :is(.apps, .keys, .numpad) { border-radius: 22px; padding: 6px; gap: 4px; }
.card[data-style="cristal"] :is(.app, .key) { border-radius: 16px; transition: background 0.2s; }
.card[data-style="cristal"] .key { height: 46px; }
.card[data-style="cristal"] .app.active { background: color-mix(in srgb, currentColor 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 30%, transparent); }
.card[data-style="cristal"] :is(.app, .key):is(.pressed, :active) { background: color-mix(in srgb, var(--tv-ink) 8%, transparent); }
.card[data-style="cristal"] .dir { --tv-press: 34%; --tv-press-mid: 13%; }
.card:is([data-style="relieve"], [data-style="cristal"]) .dir:is(.pressed, :active) {
  background: radial-gradient(var(--tv-press-size) at var(--tv-press-at),
    color-mix(in srgb, var(--tv-accent) var(--tv-press), transparent),
    color-mix(in srgb, var(--tv-accent) var(--tv-press-mid), transparent) 45%,
    transparent);
}
.card[data-style="cristal"] .ok { background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow); }
.card[data-style="cristal"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 0 16px -4px var(--tv-accent); color: var(--tv-ink); }
.card[data-style="cristal"] .modes { border-radius: 18px; padding: 4px; }
.card[data-style="cristal"] .mode { border-radius: 14px; height: 40px; }
.card[data-style="cristal"] .mode[aria-checked="true"] { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .mode[aria-checked="true"] { background: rgb(255 255 255 / 0.13); }
.card[data-style="cristal"] .picker {
  border-radius: 22px;
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), color-mix(in srgb, var(--tv-surface) 80%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(170%); backdrop-filter: blur(24px) saturate(170%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 24px 48px -20px var(--tv-shadow);
}
.card[data-style="cristal"] .picker-item .tv-ico { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line); }
.card[data-style="cristal"] .picker-item.active { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .picker-item.active { background: rgb(255 255 255 / 0.13); }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: color-mix(in srgb, var(--tv-surface) 75%, #ffffff); }
  .card[data-style="cristal"][data-theme="dark"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: #1b1e24; }
}

.card { --tv-cta-bg: var(--tv-ink); --tv-cta-ink: var(--tv-surface); --tv-cta-shadow: 0 10px 24px -10px var(--tv-shadow); }
.card[data-theme="light"] {
  --tv-cta-bg: linear-gradient(180deg, #ffffff, #f1f4f8); --tv-cta-ink: var(--tv-ink);
  --tv-cta-shadow: 0 0 0 1px var(--tv-line), 0 14px 26px -12px rgb(25 35 55 / 0.38), 0 2px 5px -2px rgb(25 35 55 / 0.18), inset 0 1px 0 #ffffff;
}
.card[data-status="on"] .power { color: var(--tv-on); }
.card:is([data-status="off"], [data-status="unavailable"]) :is(.apps, .pad .dir, .modes, .keys) { opacity: 0.4; transition: opacity 0.5s; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok { color: var(--tv-cta-ink); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok::before { opacity: 1; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-face { opacity: 0; transform: scale(0.7); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-power { opacity: 1; transform: none; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok:is(.pressed, :active) { transform: scale(0.96); }
.card[data-busy="true"] .ok-power ha-icon { animation: tv-spin 0.9s linear infinite; }
.card [aria-expanded="true"]:is(.key, .round, .dir) { color: var(--tv-ink); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1.5px var(--tv-ink-2); }

@keyframes tv-pulse { 50% { opacity: 0.45; } }
@keyframes tv-spin { to { transform: rotate(360deg); } }
@keyframes tv-pop { from { opacity: 0; transform: translateY(-6px) scale(0.97); } }
@media (prefers-reduced-motion: reduce) {
  .card, .card * { transition: none !important; animation: none !important; }
}
`;
// node_modules/lit-html/directive.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$1 = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
};
var e$2 = (t) => (...e) => ({
	_$litDirective$: t,
	values: e
});
var i$2 = class {
	constructor(t) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(t, e, i) {
		this._$Ct = t, this._$AM = e, this._$Ci = i;
	}
	_$AS(t, e) {
		return this.update(t, e);
	}
	update(t, e) {
		return this.render(...e);
	}
};
// node_modules/lit-html/directives/class-map.js
/**
* @license
* Copyright 2018 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var e$1 = e$2(class extends i$2 {
	constructor(t) {
		if (super(t), t.type !== t$1.ATTRIBUTE || "class" !== t.name || t.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
	}
	render(t) {
		return " " + Object.keys(t).filter((s) => t[s]).join(" ") + " ";
	}
	update(s, [i]) {
		if (void 0 === this.st) {
			this.st = /* @__PURE__ */ new Set(), void 0 !== s.strings && (this.nt = new Set(s.strings.join(" ").split(/\s/).filter((t) => "" !== t)));
			for (const t in i) i[t] && !this.nt?.has(t) && this.st.add(t);
			return this.render(i);
		}
		const r = s.element.classList;
		for (const t of this.st) t in i || (r.remove(t), this.st.delete(t));
		for (const t in i) {
			const s = !!i[t];
			s === this.st.has(t) || this.nt?.has(t) || (s ? (r.add(t), this.st.add(t)) : (r.remove(t), this.st.delete(t)));
		}
		return E;
	}
}), { I: t } = j$1, i$1 = (o) => o, s = () => document.createComment(""), v = (o, n, e) => {
	/**
	* @license
	* Copyright 2020 Google LLC
	* SPDX-License-Identifier: BSD-3-Clause
	*/
	const l = o._$AA.parentNode, d = void 0 === n ? o._$AB : n._$AA;
	if (void 0 === e) e = new t(l.insertBefore(s(), d), l.insertBefore(s(), d), o, o.options);
	else {
		const t = e._$AB.nextSibling, n = e._$AM, c = n !== o;
		if (c) {
			let t;
			e._$AQ?.(o), e._$AM = o, void 0 !== e._$AP && (t = o._$AU) !== n._$AU && e._$AP(t);
		}
		if (t !== d || c) {
			let o = e._$AA;
			for (; o !== t;) {
				const t = i$1(o).nextSibling;
				i$1(l).insertBefore(o, d), o = t;
			}
		}
	}
	return e;
}, u$1 = (o, t, i = o) => (o._$AI(t, i), o), m = {}, p = (o, t = m) => o._$AH = t, M = (o) => o._$AH, h = (o) => {
	o._$AR(), o._$AA.remove();
};
// node_modules/lit-html/directives/repeat.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var u = (e, s, t) => {
	const r = /* @__PURE__ */ new Map();
	for (let l = s; l <= t; l++) r.set(e[l], l);
	return r;
};
var c = e$2(class extends i$2 {
	constructor(e) {
		if (super(e), e.type !== t$1.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, s, t) {
		let r;
		void 0 === t ? t = s : void 0 !== s && (r = s);
		const l = [], o = [];
		let i = 0;
		for (const s of e) l[i] = r ? r(s, i) : i, o[i] = t(s, i), i++;
		return {
			values: o,
			keys: l
		};
	}
	render(e, s, t) {
		return this.dt(e, s, t).values;
	}
	update(s, [t, r, c]) {
		const d = M(s), { values: p$3, keys: a } = this.dt(t, r, c);
		if (!Array.isArray(d)) return this.ut = a, p$3;
		const h$3 = this.ut ??= [], v$2 = [];
		let m, y, x = 0, j = d.length - 1, k = 0, w = p$3.length - 1;
		for (; x <= j && k <= w;) if (null === d[x]) x++;
		else if (null === d[j]) j--;
		else if (h$3[x] === a[k]) v$2[k] = u$1(d[x], p$3[k]), x++, k++;
		else if (h$3[j] === a[w]) v$2[w] = u$1(d[j], p$3[w]), j--, w--;
		else if (h$3[x] === a[w]) v$2[w] = u$1(d[x], p$3[w]), v(s, v$2[w + 1], d[x]), x++, w--;
		else if (h$3[j] === a[k]) v$2[k] = u$1(d[j], p$3[k]), v(s, d[x], d[j]), j--, k++;
		else if (void 0 === m && (m = u(a, k, w), y = u(h$3, x, j)), m.has(h$3[x])) if (m.has(h$3[j])) {
			const e = y.get(a[k]), t = void 0 !== e ? d[e] : null;
			if (null === t) {
				const e = v(s, d[x]);
				u$1(e, p$3[k]), v$2[k] = e;
			} else v$2[k] = u$1(t, p$3[k]), v(s, d[x], t), d[e] = null;
			k++;
		} else h(d[j]), j--;
		else h(d[x]), x++;
		for (; k <= w;) {
			const e = v(s, v$2[w + 1]);
			u$1(e, p$3[k]), v$2[k++] = e;
		}
		for (; x <= j;) {
			const e = d[x++];
			null !== e && h(e);
		}
		return this.ut = a, p(s, v$2), E;
	}
});
// node_modules/lit-html/directives/style-map.js
/**
* @license
* Copyright 2018 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var n = "important";
var i = " !" + n;
var o = e$2(class extends i$2 {
	constructor(t) {
		if (super(t), t.type !== t$1.ATTRIBUTE || "style" !== t.name || t.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(t) {
		return Object.keys(t).reduce((e, r) => {
			const s = t[r];
			return null == s ? e : e + `${r = r.includes("-") ? r : r.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s};`;
		}, "");
	}
	update(e, [r]) {
		const { style: s } = e.element;
		if (void 0 === this.ft) return this.ft = new Set(Object.keys(r)), this.render(r);
		for (const t of this.ft) r[t] ?? (this.ft.delete(t), t.includes("-") ? s.removeProperty(t) : s[t] = null);
		for (const t in r) {
			const e = r[t];
			if (null != e) {
				this.ft.add(t);
				const r = "string" == typeof e && e.endsWith(i);
				t.includes("-") || r ? s.setProperty(t, r ? e.slice(0, -11) : e, r ? n : "") : s[t] = e;
			}
		}
		return E;
	}
});
// src/card/template.js
var icon = (name) => name ?? A;
function bottomKey(v, id) {
	const b$2 = v.bottom[id];
	return b`<button type="button" class="key" data-act="bottom" data-id=${id} aria-label=${KEYS[id].label}
    aria-expanded=${b$2.expanded ?? A} ?disabled=${v.locked}><ha-icon icon=${icon(b$2.icon)}></ha-icon></button>`;
}
function padButton(v, dir) {
	const p = v.pad[dir];
	return b`<button type="button" class=${e$1({
		dir: true,
		[dir]: true,
		empty: p.empty
	})} data-act="pad" data-dir=${dir}
    aria-label=${KEYS[dir].label} aria-expanded=${p.expanded ?? A} ?disabled=${v.locked}><ha-icon icon=${icon(p.icon)}></ha-icon></button>`;
}
function cardTemplate(v) {
	return b`
<ha-card class="card ${e$1({ multi: v.multi })}" data-ref="card"
  data-style=${v.style} data-theme=${v.theme} data-status=${v.status} data-mode=${v.mode}
  data-roku=${String(v.roku)} data-busy=${String(v.busy)} data-numpad=${String(v.numpad)}
  style=${o({
		...v.paletteStyle,
		"--tv-accent": v.accent ?? void 0,
		"--tv-glow": v.accent ?? void 0
	})}>
  <div class="body">
    <header class="head">
      <button type="button" class="tv-name" data-act="picker" data-ref="status" aria-haspopup="listbox" aria-expanded=${String(v.pickerOpen)}>
        <span data-ref="name">${v.name}</span><ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      <div class="switch" data-ref="switch" role="group" aria-label="Controlar" ?hidden=${!v.hasCompanion}>
        <button type="button" data-act="target" data-id="tv" aria-pressed=${String(!v.roku)}>TV</button>
        <button type="button" data-act="target" data-id="roku" aria-pressed=${String(v.roku)}>Roku</button>
      </div>
      <button type="button" class="round" data-act="top_left" data-ref="topLeft" ?hidden=${v.topLeft.hidden}
        aria-label=${v.topLeft.label} aria-expanded=${v.topLeft.expanded ?? A}><ha-icon icon=${icon(v.topLeft.icon)}></ha-icon></button>
      <button type="button" class="round power" data-act="power" data-ref="power" aria-label="Encender o apagar"><ha-icon icon=${icon(v.powerIcon)}></ha-icon></button>
    </header>
    <div class="picker" data-ref="picker" role="listbox" ?hidden=${!v.pickerOpen}>${c(v.tvs, (tv) => tv.index, (tv) => b`<button type="button" class="picker-item ${e$1({ active: tv.active })}" data-act="tv" data-index=${tv.index} role="option" aria-selected=${String(tv.active)}><ha-icon class="tv-ico" icon=${tv.icon}></ha-icon><span>${tv.name}</span><ha-icon class="check" icon="mdi:check"></ha-icon></button>`)}</div>
    <div class="screen" aria-live="polite">
      <div class="glass">
        <ha-icon class="now-icon" data-ref="nowIcon" icon=${icon(v.now.icon)}></ha-icon>
        <div class="now-text">
          <div class="now-title" data-ref="state">${v.now.title}</div>
          <div class="now-sub" data-ref="nowSub">${v.now.sub || A}</div>
        </div>
      </div>
    </div>
    <section class="apps">${v.streaming.map((s) => b`<button type="button" class="app ${e$1({
		active: s.active,
		loading: s.loading
	})}" data-act="stream" data-index=${s.index} aria-label=${s.name}><ha-icon icon=${icon(s.icon)}></ha-icon></button>`)}</section>
    <section class="pad">
      ${padButton(v, "up")}${padButton(v, "left")}${padButton(v, "right")}${padButton(v, "down")}
      <button type="button" class="ok" data-act="center" data-ref="center" aria-label=${v.centerIsPower ? "Encender" : "OK"}>
        <span class="ok-face"><ha-icon data-ref="centerIcon" icon=${icon(v.centerIcon)}></ha-icon><span>OK</span></span>
        <span class="ok-power" aria-hidden="true"><ha-icon data-ref="centerPower" icon=${icon(v.centerPowerIcon)}></ha-icon></span>
      </button>
    </section>
    <section class="numpad" data-ref="numpad" role="group" aria-label="Teclado numérico">
      ${NUMPAD_DIGITS.map((d) => b`<button type="button" class="key num" data-act="digit" data-digit=${d}>${d}</button>`)}
      <button type="button" class="key num" data-act="numpad_close" aria-label="Cerrar teclado"><ha-icon icon="mdi:close"></ha-icon></button>
      <button type="button" class="key num" data-act="digit" data-digit="0">0</button>
      <button type="button" class="key num" data-act="numpad_ok" aria-label="OK"><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
    </section>
    <nav class="modes" data-ref="modes" role="radiogroup" aria-label="Modo del touchpad">${c(v.modes, (m) => m.id, (m) => b`<button type="button" class="mode" data-act="mode" data-id=${m.id} role="radio" aria-checked=${String(m.checked)} ?disabled=${v.locked}><ha-icon icon=${icon(m.icon)}></ha-icon><span>${m.label}</span></button>`)}</nav>
    <footer class="keys">
      ${bottomKey(v, "back")}${bottomKey(v, "home")}${bottomKey(v, "exit")}${bottomKey(v, "menu")}
    </footer>
    <div class="toast ${e$1({ show: v.toast.show })}" data-ref="toast" role="status" aria-live="polite">${v.toast.text}</div>
  </div>
</ha-card>`;
}
// src/config/palettes.js
var PALETTE_FIELDS = [
	"background",
	"button",
	"text",
	"accent",
	"on"
];
var BUILTIN_PALETTES = {
	grafito: {
		base: "dark",
		background: "#1b1d21",
		button: "#2c2f35",
		text: "#eceef1",
		accent: "#f0b44c",
		on: "#62d6a0"
	},
	medianoche: {
		base: "dark",
		background: "#0c1424",
		button: "#1b2a45",
		text: "#e8eef8",
		accent: "#5cc8ff",
		on: "#43dba0"
	},
	ciruela: {
		base: "dark",
		background: "#1a1220",
		button: "#2e2138",
		text: "#f1eaf5",
		accent: "#c79bff",
		on: "#6fe0a9"
	},
	bosque: {
		base: "dark",
		background: "#101a16",
		button: "#1f2e28",
		text: "#e7f0eb",
		accent: "#d9b77e",
		on: "#62dca0"
	},
	oled: {
		base: "dark",
		background: "#050506",
		button: "#18181b",
		text: "#f4f4f5",
		accent: "#ffffff",
		on: "#5ee39b"
	},
	nube: {
		base: "light",
		background: "#e6ecf4",
		button: "#ffffff",
		text: "#18202c",
		accent: "#2f62d9",
		on: "#1b9a5f"
	},
	arena: {
		base: "light",
		background: "#ece7df",
		button: "#fbf8f3",
		text: "#2a251f",
		accent: "#9a6b3f",
		on: "#3f9a62"
	},
	menta: {
		base: "light",
		background: "#e3eeea",
		button: "#fbfefc",
		text: "#16241e",
		accent: "#0f7c8c",
		on: "#1d9a5d"
	}
};
function normalizeHex(value) {
	if (Array.isArray(value)) value = value.join(",");
	const str = String(value ?? "").trim().toLowerCase();
	let m = /^#?([0-9a-f]{6})$/.exec(str);
	if (m) return `#${m[1]}`;
	m = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(str);
	if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
	m = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(str);
	if (m && m.slice(1).every((n) => Number(n) <= 255)) return `#${m.slice(1).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
	return null;
}
function normalizePalette(name, raw, warnings) {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		warnings.push(`La paleta "${name}" no es un bloque de colores; se ignoró.`);
		return null;
	}
	const base = String(raw.base ?? "").trim().toLowerCase();
	if (base && base !== "light" && base !== "dark") warnings.push(`Paleta "${name}": base "${raw.base}" desconocida; se usará "dark".`);
	const palette = { base: base === "light" ? "light" : "dark" };
	for (const field of PALETTE_FIELDS) {
		if (raw[field] === void 0 || raw[field] === null || raw[field] === "") continue;
		const hex = normalizeHex(raw[field]);
		if (hex) palette[field] = hex;
		else warnings.push(`Paleta "${name}": el color ${field} "${raw[field]}" no es válido (usa #rrggbb); se usará el de la base.`);
	}
	return palette;
}
function normalizePalettes(raw, warnings) {
	const result = { ...BUILTIN_PALETTES };
	if (raw === void 0 || raw === null) return result;
	if (typeof raw !== "object" || Array.isArray(raw)) {
		warnings.push("\"palettes\" debe ser un bloque de nombre: { colores }; se ignoró.");
		return result;
	}
	for (const [name, def] of Object.entries(raw)) {
		const palette = normalizePalette(name, def, warnings);
		if (palette) result[name] = palette;
	}
	return result;
}
function paletteRef(value) {
	if (typeof value === "string" && value.trim()) return {
		light: value.trim(),
		dark: value.trim()
	};
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const pick = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
		const ref = {
			light: pick(value.light),
			dark: pick(value.dark)
		};
		return ref.light || ref.dark ? ref : null;
	}
	return null;
}
function checkPaletteRef(ref, palettes, where, warnings) {
	for (const name of /* @__PURE__ */ new Set([ref?.light, ref?.dark])) if (name && !has(palettes, name)) warnings.push(`${where}: la paleta "${name}" no existe. Incluidas: ${Object.keys(BUILTIN_PALETTES).join(", ")}.`);
}
function contrastRatio(a, b) {
	const luminance = (hex) => {
		const [r, g, bl] = [
			1,
			3,
			5
		].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
		return .2126 * r + .7152 * g + .0722 * bl;
	};
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + .05) / (lo + .05);
}
// src/config/normalize.js
function normalizePlatform(value, warnings) {
	const v = String(value || "").toLowerCase();
	if (v.includes("samsung")) return "samsung";
	if (v.includes("roku")) return "roku";
	if (v && !v.includes("lg") && warnings) warnings.push(`Tipo de TV desconocido "${value}"; se usará LG.`);
	return "lg";
}
function normalizeColor(value) {
	if (!value) return null;
	const str = String(value).trim();
	if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(str)) return `rgb(${str})`;
	return str;
}
function normalizeCompanion(raw) {
	if (!raw || typeof raw !== "object") return null;
	const entity = raw.media_entity || raw.entity;
	const remote = raw.remote_entity || raw.remote;
	if (!entity && !remote) return null;
	return {
		platform: normalizePlatform(raw.platform || "roku"),
		entity: entity || null,
		remote: remote || null,
		palette: paletteRef(raw.palette)
	};
}
function legacyPerBrandAction(generic, lg, samsung) {
	const a = parseAction(generic);
	const aLg = parseAction(lg);
	const aSamsung = parseAction(samsung);
	const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
	if (!aLg && !aSamsung) return a;
	if ((!aLg || same(aLg, a)) && (!aSamsung || same(aSamsung, a))) return a;
	const by = {};
	if (aLg) by.lg = aLg;
	if (aSamsung) by.samsung = aSamsung;
	if (a) by.default = a;
	return {
		type: "platform",
		by
	};
}
function readPad(rawPad, fallback) {
	const result = {};
	for (const dir of DIRECTIONS) {
		let entry = rawPad?.[dir];
		if (entry !== void 0 && entry !== null && typeof entry !== "object") entry = { action: entry };
		result[dir] = {
			icon: firstDefined(entry?.icon, fallback?.[dir]?.icon) ?? null,
			action: entry && "action" in entry ? parseAction(entry.action) : fallback?.[dir]?.action ?? null
		};
	}
	return result;
}
function resolveModes(raw, warnings) {
	let ids = Array.isArray(raw.modes) ? raw.modes : [
		firstDefined(raw.mode_slot_1, "navegacion"),
		firstDefined(raw.mode_slot_2, "busqueda"),
		firstDefined(raw.mode_slot_3, "audio")
	];
	ids = ids.map((id) => has(MODE_ALIASES, id) ? MODE_ALIASES[id] : id).filter((id) => {
		if (has(FIXED_MODES, id) || CUSTOM_MODE_IDS.includes(id)) return true;
		warnings.push(RESERVED_MODES.has(id) ? `El modo "${id}" todavía no está implementado y se omitió.` : `Modo desconocido "${id}", se omitió.`);
		return false;
	});
	return ids;
}
function resolveCustomMode(raw, id, warnings) {
	const n = id.replace("custom", "");
	const fromNew = raw.custom_modes?.[id];
	if (fromNew) return {
		label: firstDefined(fromNew.label, `Personalizado ${n}`),
		icon: firstDefined(fromNew.icon, `mdi:numeric-${n}-circle-outline`),
		pad: readPad(fromNew, pad())
	};
	const legacyPad = {};
	for (const dir of DIRECTIONS) {
		const base = `${id}_${dir}`;
		legacyPad[dir] = {
			icon: firstDefined(raw[`${base}_icon`]) ?? "mdi:help",
			action: legacyPerBrandAction(raw[`${base}_value`], raw[`${base}_value_lg`], raw[`${base}_value_samsung`])
		};
	}
	return {
		label: firstDefined(raw[`${id}_label`], `Personalizado ${n}`),
		icon: firstDefined(raw[`${id}_mode_icon`], `mdi:numeric-${n}-circle-outline`),
		pad: legacyPad
	};
}
function resolveDefaultPad(raw) {
	if (raw.default_pad) return readPad(raw.default_pad, DEFAULT_PAD);
	const result = {};
	for (const dir of DIRECTIONS) {
		const value = raw[`default_${dir}_value`];
		result[dir] = {
			icon: firstDefined(raw[`default_${dir}_icon`], DEFAULT_PAD[dir].icon),
			action: firstDefined(value) !== void 0 ? parseAction(value) : DEFAULT_PAD[dir].action
		};
	}
	return result;
}
function makeStreamingSlot(index, sourceId, icon, action, accent, palette, warnings) {
	let source = SOURCES_BY_ID.get(sourceId);
	if (!source) {
		if (sourceId) warnings.push(`Fuente desconocida "${sourceId}" en el botón de streaming ${index + 1}; se usó la predeterminada.`);
		source = SOURCES_BY_ID.get(DEFAULT_STREAMING[index]);
	}
	return {
		index,
		source,
		icon: firstDefined(icon, source.icon),
		action: parseAction(action),
		accent: normalizeColor(accent),
		palette: paletteRef(palette)
	};
}
function resolveStreaming(raw, warnings) {
	if (Array.isArray(raw.streaming)) return DEFAULT_STREAMING.map((defaultId, i) => {
		const entry = raw.streaming[i] || {};
		return makeStreamingSlot(i, firstDefined(entry.source, defaultId), entry.icon, entry.action, entry.accent, entry.palette, warnings);
	});
	const keys = Object.keys(raw);
	const repoFlavor = keys.some((k) => k.startsWith("appletv_") || /^(netflix|disney|YouTube|appletv)_source$/.test(k));
	const hasPrime = keys.some((k) => k.startsWith("prime_"));
	const lastPrefix = repoFlavor || !hasPrime ? "appletv" : "prime";
	if (repoFlavor && hasPrime) warnings.push("Se ignoraron las claves prime_* porque la configuración usa appletv_* para el 4º botón de streaming.");
	if (raw.selected_sources) warnings.push("La clave selected_sources ya no se usa y se ignoró.");
	return [
		"netflix",
		"disney",
		"YouTube",
		lastPrefix
	].map((prefix, i) => {
		const defaultId = prefix === "prime" ? "prime" : DEFAULT_STREAMING[i];
		return makeStreamingSlot(i, firstDefined(raw[`${prefix}_source`], defaultId), raw[`${prefix}_icon`], raw[`${prefix}_value`], firstDefined(raw[`${prefix}_accent_color`], raw[`${prefix}_accent_hex`]), null, warnings);
	});
}
function resolveButtons(raw, warnings) {
	const fromNew = raw.buttons || {};
	const legacyAction = (prefix) => raw[`${prefix}_type`] === "numpad" ? "numpad" : raw[`${prefix}_value`];
	const legacy = {
		top_left: {
			icon: raw.exit_icon,
			action: legacyAction("exit")
		},
		power: {
			icon: raw.power_icon,
			action: raw.power_value
		},
		center: {
			icon: raw.center_icon,
			action: raw.center_value
		},
		back: {
			icon: raw.back_icon,
			action: legacyAction("back")
		},
		home: {
			icon: raw.home_icon,
			action: legacyAction("home")
		},
		menu: {
			icon: raw.menu_icon,
			action: legacyAction("menu")
		},
		exit: {}
	};
	const result = {};
	for (const [id, def] of Object.entries(DEFAULT_BUTTONS)) {
		let n = fromNew[id] || {};
		if (typeof n !== "object") n = { action: n };
		const l = legacy[id] || {};
		const actionRaw = "action" in n ? n.action : firstDefined(l.action, def.action);
		result[id] = {
			icon: firstDefined(n.icon, l.icon, def.icon) ?? null,
			action: parseAction(actionRaw)
		};
	}
	return result;
}
function resolveSettings(raw, warnings) {
	const modes = resolveModes(raw, warnings);
	const modeDefs = {};
	for (const id of modes) modeDefs[id] = has(FIXED_MODES, id) ? {
		id,
		...FIXED_MODES[id]
	} : {
		id,
		...resolveCustomMode(raw, id, warnings)
	};
	return {
		modes,
		modeDefs,
		defaultPad: resolveDefaultPad(raw),
		streaming: resolveStreaming(raw, warnings),
		buttons: resolveButtons(raw, warnings),
		palette: paletteRef(raw.palette)
	};
}
var STYLES = [
	"relieve",
	"halo",
	"cristal"
];
function resolveStyle(value, warnings) {
	if (value === void 0 || value === null || value === "") return STYLES[0];
	const v = String(value).trim().toLowerCase();
	if (STYLES.includes(v)) return v;
	warnings.push(`Estilo desconocido "${value}"; se usará "${STYLES[0]}". Opciones: ${STYLES.join(", ")}.`);
	return STYLES[0];
}
function resolveTheme(value) {
	const v = String(value ?? "").trim().toLowerCase();
	return v === "light" || v === "auto" ? v : "dark";
}
var TV_OWN_KEYS = /* @__PURE__ */ new Set([
	"name",
	"entity",
	"type",
	"platform",
	"roku",
	"companion",
	"overrides"
]);
function normalizeConfig(raw) {
	if (!raw || typeof raw !== "object") throw new Error("Configuración inválida.");
	const warnings = [];
	const isV4 = [
		"modes",
		"buttons",
		"streaming",
		"custom_modes",
		"default_pad",
		"theme",
		"palette",
		"palettes"
	].some((k) => k in raw) || Array.isArray(raw.tvs) && raw.tvs.some((tv) => tv && ("platform" in tv || "companion" in tv));
	let rawTvs;
	if (Array.isArray(raw.tvs) && raw.tvs.length > 0) rawTvs = raw.tvs;
	else if (raw.entity) rawTvs = [{
		name: raw.name || raw.entity,
		entity: raw.entity,
		type: raw.modelConfig,
		roku: raw.roku
	}];
	else throw new Error("Define al menos una TV: usa \"tvs\" (lista) o \"entity\".");
	const globalSettings = resolveSettings(raw, warnings);
	const tvs = rawTvs.map((tv, i) => {
		if (!tv || !tv.entity) throw new Error(`La TV #${i + 1} no tiene "entity".`);
		const overrides = { ...tv.overrides || {} };
		for (const [k, v] of Object.entries(tv)) if (!TV_OWN_KEYS.has(k)) overrides[k] = v;
		const hasOverrides = Object.keys(overrides).length > 0;
		const name = String(firstDefined(tv.name, tv.entity)).trim();
		const companion = normalizeCompanion(tv.companion || tv.roku);
		const settings = hasOverrides ? resolveSettings({
			...raw,
			...overrides
		}, warnings) : globalSettings;
		const topLeft = settings.buttons.top_left.action;
		if (companion && topLeft && !(topLeft.type === "key" && topLeft.key === "exit")) warnings.push(`"${name}": con Roku, el botón propio del encabezado se reemplaza por el selector TV | Roku; su acción configurada se ignora.`);
		return {
			name,
			entity: tv.entity,
			platform: normalizePlatform(firstDefined(tv.platform, tv.type), warnings),
			companion,
			settings
		};
	});
	const palettes = normalizePalettes(raw.palettes, warnings);
	for (const tv of tvs) {
		const { settings, companion } = tv;
		checkPaletteRef(settings.palette, palettes, `"${tv.name}"`, warnings);
		checkPaletteRef(companion?.palette, palettes, `"${tv.name}" (modo Roku)`, warnings);
		for (const slot of settings.streaming) checkPaletteRef(slot.palette, palettes, `Botón de streaming ${slot.index + 1}`, warnings);
	}
	const cardId = firstDefined(raw.card_id, `auto:${tvs.map((t) => t.entity).join(",")}`);
	return deepFreeze({
		format: isV4 ? "v4" : "legacy",
		cardId: String(cardId),
		theme: resolveTheme(firstDefined(raw.theme, raw.colorMode)),
		style: resolveStyle(raw.style, warnings),
		palettes,
		controlModeEntity: firstDefined(raw.control_mode_entity) ?? null,
		tvs,
		warnings: [...new Set(warnings)]
	});
}
// src/platforms.js
var UnsupportedActionError = class extends Error {
	constructor(platformId, what) {
		super(`La plataforma "${platformId}" no soporta: ${what}`);
		this.name = "UnsupportedActionError";
	}
};
var PLATFORMS = {
	lg: {
		id: "lg",
		label: "LG webOS",
		integration: "webostv",
		supportsCommands: true,
		sendCode(hass, device, code) {
			return hass.callService("webostv", "button", {
				entity_id: device.entity,
				button: code
			});
		},
		sendCommand(hass, device, command, payload) {
			const data = {
				entity_id: device.entity,
				command
			};
			if (payload && Object.keys(payload).length) data.payload = payload;
			return hass.callService("webostv", "command", data);
		},
		selectInput(hass, device, input) {
			const target = INPUTS[input]?.lg;
			if (!target) return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
			return target.app ? this.sendCommand(hass, device, "system.launcher/launch", { id: target.app }) : this.sendCommand(hass, device, "tv/switchInput", { inputId: target.inputId });
		}
	},
	samsung: {
		id: "samsung",
		label: "Samsung (SamsungTV Smart)",
		integration: "samsungtv_smart",
		supportsCommands: false,
		sendCode(hass, device, code) {
			return hass.callService("media_player", "play_media", {
				entity_id: device.entity,
				media_content_type: "send_key",
				media_content_id: code
			});
		},
		selectInput(hass, device, input) {
			const code = INPUTS[input]?.samsung;
			if (!code) return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
			return this.sendCode(hass, device, code);
		}
	},
	roku: {
		id: "roku",
		label: "Roku",
		integration: "roku",
		supportsCommands: false,
		sendCode(hass, device, code) {
			return hass.callService("remote", "send_command", {
				entity_id: device.remote,
				command: code
			});
		}
	}
};
var PLATFORM_DEFAULTS = {
	selectSource(hass, device, source) {
		return hass.callService("media_player", "select_source", {
			entity_id: device.entity,
			source
		});
	},
	turnOn(hass, device) {
		return hass.callService("media_player", "turn_on", { entity_id: device.entity });
	},
	turnOff(hass, device) {
		return hass.callService("media_player", "turn_off", { entity_id: device.entity });
	},
	sendCommand() {
		return Promise.reject(new UnsupportedActionError(this.id, "commands"));
	},
	selectInput(hass, device, input) {
		return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
	}
};
for (const platform of Object.values(PLATFORMS)) Object.setPrototypeOf(platform, PLATFORM_DEFAULTS);
function getPlatform(id) {
	return has(PLATFORMS, id) ? PLATFORMS[id] : null;
}
// src/execute.js
async function executeAction(hass, action, device) {
	if (!hass || !action || !device) return;
	const platform = getPlatform(device.platform);
	if (!platform) throw new Error(`Plataforma desconocida: ${device.platform}`);
	const resolved = resolveForPlatform(action, platform.id);
	if (!resolved) return;
	switch (resolved.type) {
		case "key": {
			const code = KEYS[resolved.key]?.[platform.id];
			if (!code) throw new UnsupportedActionError(platform.id, `tecla "${resolved.key}"`);
			return platform.sendCode(hass, device, code);
		}
		case "button": return platform.sendCode(hass, device, resolved.button);
		case "command": return platform.sendCommand(hass, device, resolved.command, resolved.payload);
		case "source": return platform.selectSource(hass, device, resolved.source);
		case "input": return platform.selectInput(hass, device, resolved.input);
		case "service": {
			const [domain, service] = resolved.service.split(".");
			return hass.callService(domain, service, resolved.data);
		}
		case "sequence":
			for (let i = 0; i < resolved.steps.length; i++) {
				if (i > 0) await delay(resolved.delay);
				await executeAction(hass, resolved.steps[i], device);
			}
			return;
		case "numpad": throw new Error("\"numpad\" es una acción de la tarjeta, no de la TV");
		default: throw new Error(`Tipo de acción desconocido: ${resolved.type}`);
	}
}
// src/card/tv-control-card.js
var TvControlCard = class extends i$3 {
	static styles = r$3(CARD_CSS);
	constructor() {
		super();
		this._model = null;
		this._hass = null;
		this._ui = {
			tvIndex: 0,
			mode: null,
			roku: false,
			numpad: false
		};
		this._appliedSettings = null;
		this._shownStatus = null;
		this._pickerOpen = false;
		this._toastState = {
			text: "",
			show: false
		};
		this._watched = [];
		this._modeEntityState = void 0;
		this._restored = false;
		this._toastTimer = 0;
		this._waiters = new StateWaiters();
		this._hold = null;
		this._timing = TIMING;
		this._suppressClick = null;
		this._sequenceRunning = false;
		this._centerPress = null;
		this._centerGuardUntil = 0;
		this._lastStatus = null;
		this._busy = /* @__PURE__ */ new Map();
		this._loading = /* @__PURE__ */ new Map();
		this._stats = {
			builds: 0,
			applies: 0,
			updates: 0
		};
	}
	createRenderRoot() {
		const root = super.createRenderRoot();
		root.addEventListener("click", (e) => this._onClick(e));
		root.addEventListener("pointerdown", (e) => this._onPointerDown(e));
		for (const type of [
			"pointerup",
			"pointercancel",
			"lostpointercapture"
		]) root.addEventListener(type, () => this._stopHold());
		root.addEventListener("keydown", (e) => {
			if (e.key !== "Escape") return;
			if (this._ui.numpad) this._toggleNumpad(false);
			this._togglePicker(false);
		});
		root.addEventListener("contextmenu", (e) => {
			if (e.target.closest?.("[data-act]")) e.preventDefault();
		});
		return root;
	}
	setConfig(config) {
		const model = normalizeConfig(config);
		if (model.warnings.length) console.warn(`[${CARD_TAG}] ${model.cardId}:`, model.warnings);
		this._stopHold();
		this._togglePicker(false);
		this._model = model;
		this._ui = {
			tvIndex: 0,
			mode: null,
			roku: false,
			numpad: false
		};
		this._restored = false;
		this._appliedSettings = null;
		this._watched = [];
		this._modeEntityState = void 0;
		this._schedule();
	}
	set hass(hass) {
		this._hass = hass;
		if (!this._model) return;
		this._restoreTv();
		this._waiters.check(hass);
		this._syncModeEntity(hass);
		if (this._watchedChanged(hass)) this._schedule();
	}
	get hass() {
		return this._hass;
	}
	connectedCallback() {
		super.connectedCallback();
		this._watched = [];
		document.addEventListener("visibilitychange", this._onVisibility);
		this._schedule();
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		this._stopHold();
		document.removeEventListener("visibilitychange", this._onVisibility);
		this._togglePicker(false);
		clearTimeout(this._toastTimer);
	}
	getCardSize() {
		return 9;
	}
	getGridOptions() {
		return {
			columns: 6,
			min_columns: 4
		};
	}
	static getConfigElement() {
		return document.createElement(EDITOR_TAG);
	}
	static getStubConfig(hass) {
		return {
			card_id: "mi_tv",
			tvs: [{
				name: "Mi TV",
				entity: Object.keys(hass?.states ?? {}).find((id) => id.startsWith("media_player.")) ?? "media_player.tv",
				platform: "lg"
			}],
			modes: [
				"menu",
				"busqueda",
				"audio"
			]
		};
	}
	get _tv() {
		return this._model.tvs[this._ui.tvIndex] ?? this._model.tvs[0];
	}
	get _pad() {
		const settings = this._tv.settings;
		return this._ui.mode && settings.modeDefs[this._ui.mode]?.pad || settings.defaultPad;
	}
	get _storageKey() {
		return `tv-card__${this._model.cardId}__${this._hass?.user?.id || "default"}`;
	}
	_restoreTv() {
		if (this._restored || !this._hass) return;
		this._restored = true;
		const saved = Number.parseInt(storage.get(this._storageKey), 10);
		if (saved >= 0 && saved < this._model.tvs.length) this._ui.tvIndex = saved;
		this._ui.roku = this._loadRokuMode();
	}
	get _rokuKey() {
		return `tv-card__roku__${this._model.cardId}__${this._hass?.user?.id || "default"}__${this._tv.entity}`;
	}
	_loadRokuMode() {
		if (!this._tv.companion) return false;
		return storage.get(this._rokuKey) !== "0";
	}
	_watchedEntities() {
		const tv = this._tv;
		return [
			tv.entity,
			tv.companion?.entity,
			this._model.controlModeEntity
		].filter(Boolean);
	}
	_watchedChanged(hass) {
		const next = this._watchedEntities().map((id) => hass.states[id]);
		next.push(this._model.theme === "auto" ? !!hass.themes?.darkMode : null);
		const changed = next.length !== this._watched.length || next.some((st, i) => st !== this._watched[i]);
		this._watched = next;
		return changed;
	}
	_syncModeEntity(hass) {
		const id = this._model.controlModeEntity;
		const st = id ? hass.states[id] : void 0;
		if (!st || st === this._modeEntityState) return;
		this._modeEntityState = st;
		const value = has(MODE_ALIASES, st.state) ? MODE_ALIASES[st.state] : st.state;
		this._ui.mode = this._tv.settings.modes.includes(value) ? value : null;
	}
	_waitFor(entityId, predicate, timeoutMs) {
		return this._waiters.wait(this._hass, entityId, predicate, timeoutMs);
	}
	_schedule() {
		this.requestUpdate();
	}
	get _theme() {
		if (this._model.theme !== "auto") return this._model.theme;
		return this._hass?.themes?.darkMode ? "dark" : "light";
	}
	firstUpdated() {
		this._stats.builds++;
	}
	willUpdate() {
		if (!this._model) return;
		this._stats.updates++;
		const tv = this._tv;
		const settings = tv.settings;
		if (this._appliedSettings !== settings) {
			this._stats.applies++;
			if (this._ui.mode && !settings.modes.includes(this._ui.mode)) this._ui.mode = null;
			this._appliedSettings = settings;
		}
		const status = tvStatus(this._hass?.states?.[tv.entity]);
		if (status !== "on") {
			if (this._hold) this._stopHold();
			this._ui.numpad = false;
		}
		if (status === "on" && this._lastStatus !== null && this._lastStatus !== "on") this._centerGuardUntil = performance.now() + 800;
		this._lastStatus = status;
		this._shownStatus = status;
	}
	render() {
		if (!this._model) return A;
		return cardTemplate(this._view());
	}
	_view() {
		const tv = this._tv;
		const settings = tv.settings;
		const { buttons } = settings;
		const st = this._hass?.states?.[tv.entity];
		const status = this._shownStatus;
		const roku = this._ui.roku && !!tv.companion;
		const busy = this._busy.get(tv.entity);
		const locked = status !== "on";
		const centerIsPower = status !== "on";
		const now = describeNow({
			status,
			busy,
			roku,
			hasCompanion: !!tv.companion,
			tvState: st,
			rokuState: roku ? this._hass?.states?.[tv.companion.entity] : null,
			streaming: settings.streaming
		});
		const theme = this._theme;
		const appSlot = now.sourceId ? settings.streaming.find((sl) => sl.source.id === now.sourceId) : null;
		const palette = resolvePalette({
			palettes: this._model.palettes,
			theme,
			roku,
			appRef: appSlot?.palette,
			rokuRef: tv.companion?.palette,
			cardRef: settings.palette
		});
		const expanded = (action) => action?.type === "numpad" ? String(this._ui.numpad) : void 0;
		const pad = this._pad;
		const loadingIndex = this._loading.get(tv.entity);
		const topLeft = buttons.top_left;
		const isPlainExit = topLeft.action?.type === "key" && topLeft.action.key === "exit";
		return {
			style: this._model.style,
			theme: palette?.base ?? theme,
			paletteStyle: paletteTokens(palette),
			status,
			mode: this._ui.mode ?? "default",
			roku,
			busy: !!busy,
			numpad: this._ui.numpad,
			multi: this._model.tvs.length > 1,
			accent: now.accent,
			locked,
			name: tv.name,
			hasCompanion: !!tv.companion,
			pickerOpen: this._pickerOpen,
			topLeft: {
				hidden: !topLeft.action || isPlainExit || !!tv.companion,
				icon: topLeft.icon,
				label: topLeft.action?.type === "service" ? topLeft.action.data?.entity_id : "Acción",
				expanded: expanded(topLeft.action)
			},
			powerIcon: buttons.power.icon,
			tvs: this._model.tvs.map((t, index) => ({
				index,
				name: t.name,
				active: index === this._ui.tvIndex,
				icon: t.platform === "samsung" ? "mdi:television" : "mdi:television-play"
			})),
			now,
			streaming: settings.streaming.map((slot, index) => ({
				index,
				name: slot.source.name,
				active: !!now.sourceId && slot.source.id === now.sourceId,
				loading: loadingIndex === index,
				icon: loadingIndex === index ? "mdi:loading" : slot.icon
			})),
			pad: Object.fromEntries(DIRECTIONS.map((dir) => [dir, {
				icon: pad[dir].icon,
				empty: !pad[dir].action,
				expanded: expanded(pad[dir].action)
			}])),
			centerIsPower,
			centerIcon: buttons.center.icon,
			centerPowerIcon: busy && centerIsPower ? "mdi:loading" : buttons.power.icon,
			modes: settings.modes.map((id) => ({
				id,
				label: settings.modeDefs[id].label,
				icon: settings.modeDefs[id].icon,
				checked: id === this._ui.mode
			})),
			bottom: Object.fromEntries(BOTTOM_BUTTONS.map((id) => [id, {
				icon: buttons[id].icon,
				expanded: expanded(buttons[id].action)
			}])),
			toast: this._toastState
		};
	}
	_actionFor(el) {
		const buttons = this._tv.settings.buttons;
		switch (el.dataset.act) {
			case "pad": return this._pad[el.dataset.dir]?.action ?? null;
			case "center": return buttons.center.action;
			case "bottom": return buttons[el.dataset.id]?.action ?? null;
			case "top_left": return this._tv.companion ? null : buttons.top_left.action;
			default: return null;
		}
	}
	_onClick(e) {
		const el = e.target.closest?.("[data-act]");
		if (!el || !this._model || !this.hasUpdated) return;
		const suppress = this._suppressClick;
		if (suppress?.el === el && performance.now() < suppress.until) {
			this._suppressClick = null;
			return;
		}
		if (el.disabled) return;
		switch (el.dataset.act) {
			case "center": return this._onCenter();
			case "pad":
			case "bottom": return this._press(this._actionFor(el));
			case "top_left": return this._press(this._actionFor(el));
			case "target": return this._setRoku(el.dataset.id === "roku");
			case "power": return this._power();
			case "stream": return this._stream(Number(el.dataset.index));
			case "mode": return this._toggleMode(el.dataset.id);
			case "digit": return this._numpadKey({
				type: "key",
				key: `digit_${el.dataset.digit}`
			});
			case "numpad_ok": return this._numpadKey({
				type: "key",
				key: "enter"
			});
			case "numpad_close": return this._toggleNumpad(false);
			case "picker": return this._togglePicker();
			case "tv": return this._selectTv(Number(el.dataset.index));
		}
	}
	_onPointerDown(e) {
		if (e.button !== 0 || !this._model || !this.hasUpdated) return;
		const el = e.target.closest?.("[data-act]");
		if (!el || el.disabled) return;
		if (el.dataset.act === "center") {
			this._centerPress = {
				power: this._shownStatus !== "on",
				at: performance.now()
			};
			if (this._centerPress.power) return;
		}
		const action = this._actionFor(el);
		if (!isHoldable(action)) return;
		this._suppressClick = {
			el,
			until: Infinity
		};
		this._startHold(el, action, e.pointerId);
	}
	_onVisibility = () => {
		if (document.hidden) this._stopHold();
	};
	async _startHold(el, action, pointerId) {
		this._stopHold();
		const device = this._route(action);
		const hold = {
			el,
			pointerId,
			active: true
		};
		this._hold = hold;
		el.classList.add("pressed");
		try {
			el.setPointerCapture(pointerId);
		} catch {}
		this._haptic();
		const { holdDelay, holdInterval, holdMaxRepeats } = this._timing;
		try {
			await executeAction(this._hass, action, device);
			await delay(holdDelay);
			for (let i = 0; i < holdMaxRepeats && hold.active; i++) {
				const started = performance.now();
				await executeAction(this._hass, action, device);
				const rest = holdInterval - (performance.now() - started);
				if (rest > 0 && hold.active) await delay(rest);
			}
		} catch (err) {
			this._showError(err);
		} finally {
			if (this._hold === hold) this._stopHold();
		}
	}
	_stopHold() {
		const hold = this._hold;
		if (!hold) return;
		hold.active = false;
		this._hold = null;
		hold.el.classList.remove("pressed");
		try {
			if (hold.el.hasPointerCapture?.(hold.pointerId)) hold.el.releasePointerCapture(hold.pointerId);
		} catch {}
		if (this._suppressClick?.el === hold.el) this._suppressClick.until = performance.now() + 600;
	}
	_haptic(type = "light") {
		this.dispatchEvent(new CustomEvent("haptic", {
			detail: type,
			bubbles: true,
			composed: true
		}));
	}
	_press(action) {
		if (!action) return;
		if (action.type === "numpad") return this._toggleNumpad();
		if (action.type === "sequence") return this._runSequence(action);
		this._haptic();
		this._run(action);
	}
	async _runSequence(action) {
		if (this._sequenceRunning) return;
		this._sequenceRunning = true;
		this._haptic();
		try {
			await this._run(action);
		} finally {
			this._sequenceRunning = false;
		}
	}
	_numpadKey(action) {
		this._haptic();
		const tv = this._tv;
		this._run(action, {
			platform: tv.platform,
			entity: tv.entity
		});
	}
	_toggleNumpad(force) {
		const open = force ?? !this._ui.numpad;
		if (open === this._ui.numpad) return;
		if (open && tvStatus(this._hass?.states?.[this._tv.entity]) !== "on") {
			this._toast("Enciende la TV para usar el teclado numérico.");
			return;
		}
		this._haptic();
		this._stopHold();
		this._ui.numpad = open;
		this._schedule();
	}
	_route(action) {
		return routeAction(action, {
			tv: this._tv,
			rokuMode: this._ui.roku,
			mode: this._ui.mode
		});
	}
	_run(action, device = this._route(action)) {
		return executeAction(this._hass, action, device).catch((err) => this._showError(err));
	}
	_setBusy(entity, label) {
		if (label) this._busy.set(entity, label);
		else this._busy.delete(entity);
		this._schedule();
	}
	_setLoading(entity, index) {
		if (index === null) this._loading.delete(entity);
		else this._loading.set(entity, index);
		this._schedule();
	}
	async _ensureOn(tv) {
		if (tvStatus(this._hass?.states?.[tv.entity]) === "on") return true;
		this._setBusy(tv.entity, "Encendiendo…");
		try {
			await getPlatform(tv.platform).turnOn(this._hass, {
				platform: tv.platform,
				entity: tv.entity
			});
			return await this._waitFor(tv.entity, (s) => tvStatus(s) === "on", this._timing.powerOn);
		} finally {
			this._setBusy(tv.entity, null);
		}
	}
	async _power() {
		const tv = this._tv;
		if (this._busy.has(tv.entity)) return;
		if (tvStatus(this._hass?.states?.[tv.entity]) !== "on") return this._turnOn();
		this._haptic();
		const custom = tv.settings.buttons.power.action;
		if (custom) return this._run(custom);
		this._setBusy(tv.entity, "Apagando…");
		try {
			await getPlatform(tv.platform).turnOff(this._hass, {
				platform: tv.platform,
				entity: tv.entity
			});
			await this._waitFor(tv.entity, (s) => tvStatus(s) !== "on", this._timing.powerOff);
		} catch (err) {
			this._showError(err);
		} finally {
			this._setBusy(tv.entity, null);
		}
	}
	async _turnOn() {
		const tv = this._tv;
		if (this._busy.has(tv.entity)) return;
		if (tvStatus(this._hass?.states?.[tv.entity]) === "on") return;
		this._haptic();
		const custom = tv.settings.buttons.power.action;
		if (custom) return this._run(custom);
		try {
			if (!await this._ensureOn(tv)) this._toast(tv.platform === "lg" ? "La TV no confirmó el encendido. En LG, revisa que el encendido (Wake on LAN) esté configurado en HA." : "La TV no confirmó el encendido.");
		} catch (err) {
			this._showError(err);
		}
	}
	_onCenter() {
		const press = this._centerPress;
		this._centerPress = null;
		if (press && performance.now() - press.at < 1500 ? press.power : this._shownStatus !== "on") return this._turnOn();
		if (performance.now() < this._centerGuardUntil) return;
		return this._press(this._tv.settings.buttons.center.action);
	}
	async _selectSourceConfirmed(device, candidates) {
		const platform = getPlatform(device.platform);
		const preferAppName = device.platform === "roku";
		const name = resolveSourceName(this._hass?.states?.[device.entity], candidates);
		for (let attempt = 1; attempt <= 2; attempt++) {
			await platform.selectSource(this._hass, device, name);
			if (await this._waitFor(device.entity, (s) => sourceMatches(s, candidates, preferAppName), this._timing.sourceConfirm)) return true;
		}
		return false;
	}
	async _stream(index) {
		const tv = this._tv;
		const slot = tv.settings.streaming[index];
		if (!slot || this._loading.has(tv.entity)) return;
		const { source } = slot;
		const companion = tv.companion;
		const viaRoku = !slot.action && !!source.rokuSource && !!companion?.entity && (this._ui.roku || !source.service);
		if (!slot.action && !viaRoku && !source.service) {
			this._toast(`${source.name} solo está disponible a través de un Roku.`);
			return;
		}
		this._haptic();
		this._setLoading(tv.entity, index);
		const tvDevice = {
			platform: tv.platform,
			entity: tv.entity
		};
		try {
			await this._ensureOn(tv);
			let ok = true;
			if (slot.action) await executeAction(this._hass, slot.action, this._route(slot.action));
			else if (source.input) await executeAction(this._hass, {
				type: "input",
				input: source.input
			}, tvDevice);
			else if (viaRoku) {
				if (!this._ui.roku) await this._selectSourceConfirmed(tvDevice, SOURCES_BY_ID.get("roku").alternates);
				ok = await this._selectSourceConfirmed({
					platform: companion.platform,
					entity: companion.entity
				}, [source.rokuSource]);
			} else ok = await this._selectSourceConfirmed(tvDevice, source.alternates ?? [source.service]);
			if (!ok) this._toast(`No se pudo confirmar el cambio a ${source.name}.`);
		} catch (err) {
			this._showError(err);
		} finally {
			this._setLoading(tv.entity, null);
		}
	}
	_setRoku(on) {
		if (!this._tv.companion || this._ui.roku === on) return;
		this._haptic();
		this._stopHold();
		this._ui.roku = on;
		storage.set(this._rokuKey, on ? "1" : "0");
		this._schedule();
	}
	_toggleMode(id) {
		this._haptic();
		this._stopHold();
		this._ui.numpad = false;
		this._ui.mode = this._ui.mode === id ? null : id;
		this._schedule();
	}
	_togglePicker(force) {
		const open = force ?? !this._pickerOpen;
		if (open === this._pickerOpen || open && !(this._model?.tvs.length > 1)) return;
		this._pickerOpen = open;
		if (open) document.addEventListener("pointerdown", this._onOutsidePointer, true);
		else document.removeEventListener("pointerdown", this._onOutsidePointer, true);
		this._schedule();
	}
	_onOutsidePointer = (e) => {
		const path = e.composedPath();
		const root = this.renderRoot;
		if (!path.includes(root.querySelector(".picker")) && !path.includes(root.querySelector(".tv-name"))) this._togglePicker(false);
	};
	_selectTv(index) {
		if (!(index >= 0 && index < this._model.tvs.length)) return;
		this._togglePicker(false);
		if (index === this._ui.tvIndex) return;
		this._haptic();
		this._stopHold();
		this._ui.tvIndex = index;
		this._ui.mode = null;
		this._ui.numpad = false;
		this._ui.roku = this._loadRokuMode();
		this._watched = [];
		storage.set(this._storageKey, index);
		this._schedule();
	}
	_toast(message) {
		if (!this.hasUpdated) return;
		this._toastState = {
			text: message,
			show: true
		};
		this._schedule();
		clearTimeout(this._toastTimer);
		this._toastTimer = setTimeout(() => {
			this._toastState = {
				...this._toastState,
				show: false
			};
			this._schedule();
		}, 3500);
	}
	_showError(err) {
		console.warn(`[${CARD_TAG}]`, err);
		const message = err instanceof UnsupportedActionError ? err.message : `Error: ${err?.message ?? err}`;
		this._toast(message);
	}
};
// src/editor/catalogs.js
var ACTION_UI_TYPES = {
	default: "Predeterminada",
	none: "Ninguna",
	key: "Tecla",
	input: "Entrada (HDMI / antena)",
	source: "Fuente por nombre (select_source)",
	script: "Script o escena",
	service: "Servicio de HA",
	command: "Command LG (webOS)",
	button: "Botón crudo (código)",
	sequence: "Secuencia de pasos (p. ej. un PIN)",
	numpad: "Abrir teclado numérico",
	platform: "Distinta por marca"
};
var ALL_ACTION_TYPES = [
	"key",
	"input",
	"source",
	"script",
	"service",
	"command",
	"button",
	"sequence",
	"numpad",
	"platform"
];
var STEP_ACTION_TYPES = [
	"key",
	"button",
	"command",
	"input",
	"source",
	"script",
	"service"
];
var BRAND_ACTION_TYPES = [
	"key",
	"input",
	"source",
	"script",
	"service",
	"command",
	"button",
	"sequence"
];
var BRANDS = [
	["lg", "LG"],
	["samsung", "Samsung"],
	["roku", "Roku"],
	["default", "Otras marcas"]
];
var PLATFORM_NAMES = {
	lg: "LG",
	samsung: "Samsung",
	roku: "Roku"
};
var KEY_OPTIONS = Object.entries(KEYS).map(([id, def]) => {
	const brands = [
		"lg",
		"samsung",
		"roku"
	].filter((p) => def[p]).map((p) => PLATFORM_NAMES[p]);
	return {
		value: id,
		label: `${def.label} (${id}) · ${brands.join(", ") || "ninguna"}`
	};
});
var LG_COMMANDS = [
	{
		value: "system.launcher/launch",
		label: "Abrir app · payload: { id: \"netflix\" }"
	},
	{
		value: "tv/switchInput",
		label: "Cambiar entrada · payload: { inputId: \"HDMI_1\" }"
	},
	{
		value: "com.webos.service.tvpower/power/turnOffScreen",
		label: "Apagar la pantalla (el audio sigue)"
	},
	{
		value: "com.webos.service.tvpower/power/turnOnScreen",
		label: "Encender la pantalla"
	},
	{
		value: "system.notifications/createToast",
		label: "Mostrar un mensaje · payload: { message: \"Hola\" }"
	},
	{
		value: "media.controls/play",
		label: "Play"
	},
	{
		value: "media.controls/pause",
		label: "Pausa"
	},
	{
		value: "media.controls/stop",
		label: "Stop"
	},
	{
		value: "media.controls/rewind",
		label: "Rebobinar"
	},
	{
		value: "media.controls/fastForward",
		label: "Avance rápido"
	},
	{
		value: "com.webos.service.ime/insertText",
		label: "Escribir texto · payload: { text: \"abc\", replace: 0 }"
	},
	{
		value: "system.launcher/open",
		label: "Abrir URL en el navegador · payload: { target: \"https://…\" }"
	}
];
var INPUT_OPTIONS = Object.entries(INPUTS).map(([id, def]) => ({
	value: id,
	label: def.label
}));
var SOURCE_OPTIONS = SOURCES.map((s) => ({
	value: s.id,
	label: s.service ? s.name : `${s.name} (solo por Roku)`
}));
var STYLE_OPTIONS = [
	{
		value: "relieve",
		label: "Relieve (predeterminado)"
	},
	{
		value: "halo",
		label: "Halo"
	},
	{
		value: "cristal",
		label: "Cristal"
	}
];
var THEME_OPTIONS = [
	{
		value: "dark",
		label: "Oscuro (predeterminado)"
	},
	{
		value: "light",
		label: "Claro"
	},
	{
		value: "auto",
		label: "Automático (sigue a HA)"
	}
];
var TV_PLATFORM_OPTIONS = [{
	value: "lg",
	label: "LG (webOS)"
}, {
	value: "samsung",
	label: "Samsung"
}];
var DIRECTION_LABELS = {
	up: "Arriba",
	left: "Izquierda",
	right: "Derecha",
	down: "Abajo"
};
var BUTTON_LABELS = {
	top_left: "Botón del encabezado (izquierda)",
	power: "Encender / apagar",
	center: "Centro del touchpad (OK)",
	back: "Atrás",
	home: "Inicio",
	exit: "Salir",
	menu: "Menú"
};
var DEFAULT_MODES = [
	"menu",
	"busqueda",
	"audio"
];
// src/editor/paths.js
var isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
var clone = (v) => v === void 0 ? void 0 : JSON.parse(JSON.stringify(v));
var sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function getPath(obj, path) {
	let cur = obj;
	for (const k of path) {
		if (cur === null || cur === void 0) return void 0;
		cur = cur[k];
	}
	return cur;
}
function setPath(obj, path, value) {
	if (path.length === 0) return value;
	const [k, ...rest] = path;
	const base = Array.isArray(obj) ? [...obj] : isPlainObject(obj) ? { ...obj } : typeof k === "number" ? [] : {};
	const next = setPath(base[k], rest, value);
	if (next === void 0) {
		if (Array.isArray(base)) base.splice(k, 1);
		else delete base[k];
	} else base[k] = next;
	return base;
}
function deletePath(obj, path) {
	let out = setPath(obj, path, void 0);
	for (let i = path.length - 1; i > 0; i--) {
		const parent = getPath(out, path.slice(0, i));
		if (!isPlainObject(parent) || Object.keys(parent).length > 0) break;
		out = setPath(out, path.slice(0, i), void 0);
	}
	return out;
}
function fieldNames(schema) {
	return schema.flatMap((item) => Array.isArray(item.schema) && !item.name ? fieldNames(item.schema) : [item.name]);
}
function expandShortcuts(config) {
	if (!isPlainObject(config)) return {};
	const toEntry = (v) => v !== null && v !== void 0 && !isPlainObject(v) ? { action: v } : v;
	const fixPad = (p) => isPlainObject(p) ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, DIRECTIONS.includes(k) ? toEntry(v) : v])) : p;
	const fixSettings = (s) => {
		const out = { ...s };
		if (isPlainObject(s.buttons)) out.buttons = Object.fromEntries(Object.entries(s.buttons).map(([k, v]) => [k, toEntry(v)]));
		if (isPlainObject(s.custom_modes)) out.custom_modes = Object.fromEntries(Object.entries(s.custom_modes).map(([k, v]) => [k, fixPad(v)]));
		if (isPlainObject(s.default_pad)) out.default_pad = fixPad(s.default_pad);
		return out;
	};
	const out = fixSettings(config);
	if (Array.isArray(out.tvs)) out.tvs = out.tvs.map((tv) => isPlainObject(tv) && isPlainObject(tv.overrides) ? {
		...tv,
		overrides: fixSettings(tv.overrides)
	} : tv);
	return out;
}
// src/editor/action-form.js
function actionToForm(raw) {
	if (raw === void 0) return { type: "default" };
	if (raw === null) return { type: "none" };
	if (Array.isArray(raw)) return {
		type: "sequence",
		delay: 400
	};
	const a = isPlainObject(raw) ? raw : parseAction(raw);
	if (!isPlainObject(a)) return { type: "none" };
	switch (a.type) {
		case "key": return {
			type: "key",
			key: a.key ?? ""
		};
		case "source": return {
			type: "source",
			source: a.source ?? ""
		};
		case "input": return {
			type: "input",
			input: a.input ?? ""
		};
		case "service": {
			const data = isPlainObject(a.data) ? a.data : {};
			const entity = data.entity_id;
			const onlyEntity = Object.keys(data).every((k) => k === "entity_id") && (entity === void 0 || typeof entity === "string");
			if ((a.service === "script.turn_on" || a.service === "scene.turn_on") && onlyEntity) return {
				type: "script",
				entity: entity ?? ""
			};
			return {
				type: "service",
				service: a.service ?? "",
				data
			};
		}
		case "command": return {
			type: "command",
			command: a.command ?? "",
			payload: isPlainObject(a.payload) ? a.payload : {}
		};
		case "button": return {
			type: "button",
			button: a.button ?? ""
		};
		case "sequence": return {
			type: "sequence",
			delay: a.delay ?? 400
		};
		case "numpad":
		case "platform": return { type: a.type };
		default: return { type: "none" };
	}
}
function formToAction(data, prevRaw) {
	const prev = actionToForm(prevRaw);
	const changed = data.type !== prev.type;
	const v = changed ? {} : data;
	switch (data.type) {
		case "default": return;
		case "none": return null;
		case "key": return v.key ? v.key : {
			type: "key",
			key: ""
		};
		case "source": return {
			type: "source",
			source: v.source ?? ""
		};
		case "input": return v.input ? `input:${v.input}` : {
			type: "input",
			input: ""
		};
		case "script": return v.entity ? v.entity : {
			type: "service",
			service: "script.turn_on",
			data: {}
		};
		case "service": return {
			type: "service",
			service: v.service ?? "",
			data: isPlainObject(v.data) ? v.data : {}
		};
		case "command": {
			const out = {
				type: "command",
				command: v.command ?? ""
			};
			if (isPlainObject(v.payload) && Object.keys(v.payload).length) out.payload = v.payload;
			return out;
		}
		case "button": return {
			type: "button",
			button: v.button ?? ""
		};
		case "sequence": {
			let steps = [];
			if (Array.isArray(prevRaw)) steps = prevRaw;
			else if (isPlainObject(prevRaw) && prevRaw.type === "sequence" && Array.isArray(prevRaw.steps)) steps = prevRaw.steps;
			const ms = Number(v.delay);
			return {
				type: "sequence",
				steps,
				delay: v.delay !== void 0 && v.delay !== "" && Number.isFinite(ms) ? Math.max(0, ms) : 400
			};
		}
		case "numpad": return "numpad";
		case "platform": return {
			type: "platform",
			by: !changed && isPlainObject(prevRaw?.by) ? prevRaw.by : {}
		};
		default: return;
	}
}
function actionSchema(form, { allowDefault = false, allowNone = true, types = ALL_ACTION_TYPES, defaultLabel } = {}) {
	const options = [];
	if (allowDefault) options.push({
		value: "default",
		label: defaultLabel ?? ACTION_UI_TYPES.default
	});
	if (allowNone) options.push({
		value: "none",
		label: ACTION_UI_TYPES.none
	});
	for (const t of types) options.push({
		value: t,
		label: ACTION_UI_TYPES[t]
	});
	const schema = [{
		name: "type",
		label: "Acción",
		selector: { select: {
			mode: "dropdown",
			options
		} }
	}];
	switch (form.type) {
		case "key":
			schema.push({
				name: "key",
				label: "Tecla",
				selector: { select: {
					mode: "dropdown",
					options: KEY_OPTIONS
				} }
			});
			break;
		case "source":
			schema.push({
				name: "source",
				label: "Fuente",
				helper: "El nombre exacto de la lista de fuentes de la TV. Para un HDMI conviene \"Entrada\": no depende del nombre.",
				selector: { text: {} }
			});
			break;
		case "input":
			schema.push({
				name: "input",
				label: "Entrada",
				helper: "Por puerto: funciona aunque la entrada tenga otro nombre en la TV. LG y Samsung.",
				selector: { select: {
					mode: "dropdown",
					options: INPUT_OPTIONS
				} }
			});
			break;
		case "script":
			schema.push({
				name: "entity",
				label: "Script o escena",
				selector: { entity: { filter: { domain: ["script", "scene"] } } }
			});
			break;
		case "service":
			schema.push({
				name: "service",
				label: "Servicio",
				helper: "dominio.servicio, p. ej. light.turn_on",
				selector: { text: {} }
			}, {
				name: "data",
				label: "Datos del servicio",
				selector: { object: {} }
			});
			break;
		case "command":
			schema.push({
				name: "command",
				label: "Command",
				helper: "Elige uno de la lista o escribe otro URI (sin ssap://).",
				selector: { select: {
					mode: "dropdown",
					custom_value: true,
					options: LG_COMMANDS
				} }
			}, {
				name: "payload",
				label: "Payload",
				selector: { object: {} }
			});
			break;
		case "button":
			schema.push({
				name: "button",
				label: "Código",
				helper: "Se manda tal cual: KEY_HDMI (Samsung), INPUT_HUB (LG)…",
				selector: { text: {} }
			});
			break;
		case "sequence": schema.push({
			name: "delay",
			label: "Pausa entre pasos (ms)",
			selector: { number: {
				min: 0,
				max: 5e3,
				step: 50,
				mode: "box"
			} }
		});
	}
	return schema;
}
// src/editor/fold.js
function fold(head, children, { summary = "", open = false } = {}) {
	const direct = children.filter((child) => !child.parent).map((child) => child.depth ?? 0);
	head.fold = {
		summary,
		open,
		base: direct.length ? Math.min(...direct) : head.depth ?? 0
	};
	for (const child of children) child.parent ??= head.key;
	return [head, ...children];
}
function childrenByParent(nodes) {
	const map = /* @__PURE__ */ new Map();
	for (const node of nodes) {
		const parent = node.parent ?? "";
		if (!map.has(parent)) map.set(parent, []);
		map.get(parent).push(node);
	}
	return map;
}
// src/editor/palettes.js
var NONE = "__none__";
var FIELD_LABELS = {
	background: "Fondo",
	button: "Botones",
	text: "Texto",
	accent: "Acento",
	on: "Encendido"
};
var BASE_LABELS = {
	dark: "oscura",
	light: "clara"
};
var BASE_COLORS = {
	dark: {
		background: "#16181c",
		button: "#27292d",
		text: "#eef0f3",
		accent: "#dce6f5",
		on: "#64e3a6"
	},
	light: {
		background: "#eef1f5",
		button: "#ffffff",
		text: "#1b1f25",
		accent: "#1b1f25",
		on: "#1f9d63"
	}
};
var hexToRgb = (hex) => [
	1,
	3,
	5
].map((i) => parseInt(hex.slice(i, i + 2), 16));
var baseOf = (palette) => palette?.base === "light" ? "light" : "dark";
function allPalettes(config) {
	return {
		...BUILTIN_PALETTES,
		...isPlainObject(config.palettes) ? config.palettes : {}
	};
}
function uniqueName(config, stem = "paleta") {
	const taken = allPalettes(config);
	let name = stem;
	for (let n = 2; Object.hasOwn(taken, name); n += 1) name = `${stem}-${n}`;
	return name;
}
function renameRef(ref, from, to) {
	const swap = (name) => name === from ? to ?? void 0 : name;
	if (typeof ref === "string") return swap(ref);
	if (!isPlainObject(ref)) return ref;
	const light = swap(ref.light);
	const dark = swap(ref.dark);
	if (light === void 0 && dark === void 0) return void 0;
	return {
		...light !== void 0 && { light },
		...dark !== void 0 && { dark }
	};
}
function mapPaletteRefs(config, fn) {
	const fix = (obj) => {
		if (!isPlainObject(obj) || obj.palette === void 0) return obj;
		const next = fn(obj.palette);
		if (next !== void 0) return {
			...obj,
			palette: next
		};
		const { palette: _removed, ...rest } = obj;
		return rest;
	};
	const fixSlots = (list) => Array.isArray(list) ? list.map(fix) : list;
	const fixTv = (tv) => {
		if (!isPlainObject(tv)) return tv;
		let out = tv;
		if (isPlainObject(tv.companion)) out = {
			...out,
			companion: fix(tv.companion)
		};
		if (isPlainObject(tv.overrides)) {
			let overrides = fix(tv.overrides);
			if (Array.isArray(overrides.streaming)) overrides = {
				...overrides,
				streaming: fixSlots(overrides.streaming)
			};
			out = {
				...out,
				overrides
			};
		}
		return out;
	};
	let out = fix(config);
	if (Array.isArray(out.streaming)) out = {
		...out,
		streaming: fixSlots(out.streaming)
	};
	if (Array.isArray(out.tvs)) out = {
		...out,
		tvs: out.tvs.map(fixTv)
	};
	return out;
}
function renamePalette(config, from, to) {
	const name = String(to ?? "").trim();
	const own = isPlainObject(config.palettes) ? config.palettes : {};
	if (!name || name === from || !Object.hasOwn(own, from) || Object.hasOwn(own, name)) return config;
	const palettes = Object.fromEntries(Object.entries(own).map(([key, value]) => [key === from ? name : key, value]));
	return mapPaletteRefs({
		...config,
		palettes
	}, (ref) => renameRef(ref, from, name));
}
function removePalette(config, name) {
	const next = deletePath(config, ["palettes", name]);
	if (Object.hasOwn(BUILTIN_PALETTES, name)) return next;
	return mapPaletteRefs(next, (ref) => renameRef(ref, name, null));
}
function assignmentNodes(config, path, key, depth, label, { init } = {}) {
	const raw = getPath(config, path);
	const palettes = allPalettes(config);
	const optionsFor = (current) => {
		const options = [{
			value: NONE,
			label: "Ninguna (la del estilo)"
		}, ...Object.entries(palettes).map(([name, p]) => ({
			value: name,
			label: `${name} · ${BASE_LABELS[baseOf(p)]}`
		}))];
		if (current && current !== "__none__" && !Object.hasOwn(palettes, current)) options.push({
			value: current,
			label: `${current} (no existe)`
		});
		return options;
	};
	const select = (name, text) => ({
		name,
		label: text,
		selector: { select: {
			mode: "dropdown",
			options: optionsFor(raw?.[name] ?? raw)
		} }
	});
	if (isPlainObject(raw)) {
		const same = raw.dark ?? raw.light;
		return [{
			kind: "form",
			key,
			depth,
			path,
			codec: "palette-ref",
			pair: true,
			init,
			schema: [{
				name: "",
				type: "grid",
				schema: [select("light", `${label} · claro`), select("dark", `${label} · oscuro`)]
			}],
			data: {
				light: raw.light ?? "__none__",
				dark: raw.dark ?? "__none__"
			}
		}, {
			kind: "buttons",
			key: `${key}.b`,
			depth,
			items: [{
				label: "Usar la misma en claro y oscuro",
				op: {
					op: "set",
					path,
					value: same
				}
			}]
		}];
	}
	const nodes = [{
		kind: "form",
		key,
		depth,
		path,
		codec: "palette-ref",
		init,
		schema: [{
			name: "value",
			label,
			selector: { select: {
				mode: "dropdown",
				options: optionsFor(raw)
			} }
		}],
		data: { value: typeof raw === "string" && raw ? raw : NONE }
	}];
	if (typeof raw === "string" && raw) nodes.push({
		kind: "buttons",
		key: `${key}.b`,
		depth,
		items: [{
			label: "Distinta en claro y oscuro",
			op: {
				op: "set",
				path,
				value: {
					light: raw,
					dark: raw
				}
			}
		}]
	});
	return nodes;
}
function effectiveColors(raw, base) {
	return PALETTE_FIELDS.map((field) => {
		const own = raw[field] !== void 0 ? normalizeHex(raw[field]) : null;
		return {
			field,
			label: FIELD_LABELS[field],
			color: own ?? BASE_COLORS[base][field],
			base: !own
		};
	});
}
function contrastNote(colors) {
	const by = Object.fromEntries(colors.map((c) => [c.field, c.color]));
	const part = (name, ratio) => `${ratio < 4.5 ? "⚠ " : ""}${name} ${ratio.toFixed(1)}:1`;
	const text = `Contraste ${part("texto/fondo", contrastRatio(by.text, by.background))} · ${part("texto/botones", contrastRatio(by.text, by.button))}`;
	return contrastRatio(by.text, by.background) < 4.5 || contrastRatio(by.text, by.button) < 4.5 ? `${text}. Menos de 4.5:1 cuesta leer; prueba un texto más claro u oscuro.` : text;
}
function paletteFold(config, name, index) {
	const raw = isPlainObject(config.palettes[name]) ? config.palettes[name] : {};
	const base = baseOf(raw);
	const kp = `pal.${index}`;
	const colors = effectiveColors(raw, base);
	const children = [{
		kind: "swatches",
		key: `${kp}.s`,
		depth: 1,
		colors
	}, {
		kind: "form",
		key: `${kp}.f`,
		depth: 1,
		path: ["palettes", name],
		codec: "palette-meta",
		schema: [{
			name: "",
			type: "grid",
			schema: [{
				name: "name",
				label: "Nombre",
				selector: { text: {} }
			}, {
				name: "base",
				label: "Base",
				helper: "Claro u oscuro: lo que no definas sale de aquí.",
				selector: { select: {
					mode: "dropdown",
					options: [{
						value: "dark",
						label: "Oscura"
					}, {
						value: "light",
						label: "Clara"
					}]
				} }
			}]
		}],
		data: {
			name,
			base
		}
	}];
	for (const field of PALETTE_FIELDS) {
		if (raw[field] === void 0) continue;
		children.push({
			kind: "heading",
			key: `${kp}.c.${field}`,
			depth: 1,
			level: 3,
			text: FIELD_LABELS[field],
			actions: [{
				label: "✕",
				title: "Quitar: usa el de la base",
				op: {
					op: "delete",
					path: [
						"palettes",
						name,
						field
					]
				}
			}]
		});
		children.push({
			kind: "form",
			key: `${kp}.c.${field}.f`,
			depth: 1,
			path: ["palettes", name],
			codec: "palette-color",
			field,
			schema: [{
				name: "color",
				label: "",
				selector: { color_rgb: {} }
			}],
			data: { color: hexToRgb(colors.find((c) => c.field === field).color) }
		});
	}
	const missing = PALETTE_FIELDS.filter((field) => raw[field] === void 0);
	if (missing.length) children.push({
		kind: "buttons",
		key: `${kp}.add`,
		depth: 1,
		items: missing.map((field) => ({
			label: `+ ${FIELD_LABELS[field]}`,
			op: {
				op: "set",
				path: [
					"palettes",
					name,
					field
				],
				value: BASE_COLORS[base][field]
			}
		}))
	});
	children.push({
		kind: "note",
		key: `${kp}.n`,
		depth: 1,
		text: contrastNote(colors)
	});
	const own = PALETTE_FIELDS.length - missing.length;
	return fold({
		kind: "heading",
		key: kp,
		depth: 0,
		level: 2,
		text: name,
		actions: [{
			label: "✕",
			title: "Eliminar la paleta",
			op: {
				op: "palette-delete",
				name
			}
		}]
	}, children, { summary: `${BASE_LABELS[base]} · ${own} de ${PALETTE_FIELDS.length} colores` });
}
function paletteSection(config) {
	const own = isPlainObject(config.palettes) ? config.palettes : {};
	const names = Object.keys(own);
	const fresh = uniqueName(config);
	const copyOptions = Object.entries(allPalettes(config)).map(([name, p]) => ({
		value: name,
		label: `${name} · ${BASE_LABELS[baseOf(p)]}`
	}));
	const children = [{
		kind: "note",
		key: "pal.n",
		depth: 0,
		text: "Una paleta son 5 colores y una base (clara u oscura); el resto se calcula. Se asignan en General, en cada TV, en el Roku y en cada botón de streaming."
	}];
	names.forEach((name, index) => children.push(...paletteFold({
		...config,
		palettes: own
	}, name, index)));
	children.push({
		kind: "buttons",
		key: "pal.add",
		depth: 0,
		items: [{
			label: "+ Nueva paleta",
			op: {
				op: "set",
				path: ["palettes", fresh],
				value: {
					base: "dark",
					...BASE_COLORS.dark
				},
				open: `pal.${names.length}`
			}
		}]
	});
	children.push({
		kind: "form",
		key: "pal.copy",
		depth: 0,
		path: [],
		codec: "palette-copy",
		newName: fresh,
		open: `pal.${names.length}`,
		schema: [{
			name: "from",
			label: "Crear copiando una existente",
			selector: { select: {
				mode: "dropdown",
				options: copyOptions
			} }
		}],
		data: { from: "" }
	});
	const head = {
		kind: "heading",
		key: "pal",
		depth: 0,
		level: 1,
		text: "Paletas"
	};
	const builtin = Object.keys(BUILTIN_PALETTES).length;
	return fold(head, children, { summary: `${names.length ? `${names.length} propias` : "ninguna propia"} · ${builtin} incluidas` });
}
function applyPaletteForm(config, node, data) {
	const set = (path, value) => value === void 0 ? deletePath(config, path) : setPath(config, path, value);
	switch (node.codec) {
		case "palette-ref": {
			const pick = (value) => value && value !== "__none__" ? value : void 0;
			if (!node.pair) return set(node.path, pick(data.value));
			const light = pick(data.light);
			const dark = pick(data.dark);
			return set(node.path, light || dark ? {
				...light && { light },
				...dark && { dark }
			} : void 0);
		}
		case "palette-meta": {
			let next = config;
			let name = node.path[1];
			if (data.name !== node.data.name) {
				const renamed = renamePalette(next, name, data.name);
				if (renamed !== next) {
					next = renamed;
					name = String(data.name).trim();
				}
			}
			if (data.base !== node.data.base && (data.base === "light" || data.base === "dark")) next = setPath(next, [
				"palettes",
				name,
				"base"
			], data.base);
			return next;
		}
		case "palette-color": {
			const hex = normalizeHex(data.color);
			return hex ? setPath(config, [...node.path, node.field], hex) : config;
		}
		case "palette-copy": {
			const source = allPalettes(config)[data.from];
			if (!source) return config;
			return setPath(config, ["palettes", node.newName], { ...source });
		}
		default: return config;
	}
}
// src/editor/serialize.js
function serializeAction(a) {
	if (!a) return null;
	switch (a.type) {
		case "key": return a.key;
		case "numpad": return "numpad";
		case "input": return `input:${a.input}`;
		case "service": {
			const keys = Object.keys(a.data ?? {});
			const domain = a.service.split(".")[0];
			const entity = a.data?.entity_id;
			if ((a.service === "script.turn_on" || a.service === "scene.turn_on") && keys.length === 1 && keys[0] === "entity_id" && typeof entity === "string" && new RegExp(`^${domain}\\.[a-z0-9_]+$`, "i").test(entity)) return entity;
			return {
				type: "service",
				service: a.service,
				data: clone(a.data)
			};
		}
		case "sequence": return {
			type: "sequence",
			steps: a.steps.map(serializeAction),
			delay: a.delay
		};
		case "platform": return {
			type: "platform",
			by: Object.fromEntries(Object.entries(a.by).map(([k, v]) => [k, serializeAction(v)]))
		};
		default: return clone(a);
	}
}
function serializePad(padObj, fallback) {
	const out = {};
	for (const dir of DIRECTIONS) {
		const entry = {};
		const { icon, action } = padObj[dir];
		if (icon !== (fallback?.[dir]?.icon ?? null) && icon !== null) entry.icon = icon;
		if (!sameJson(action, fallback?.[dir]?.action ?? null)) entry.action = serializeAction(action);
		if (Object.keys(entry).length) out[dir] = entry;
	}
	return out;
}
function serializeSettings(s) {
	const customModes = {};
	for (const id of s.modes) {
		if (!CUSTOM_MODE_IDS.includes(id)) continue;
		const def = s.modeDefs[id];
		const n = id.slice(-1);
		const entry = {};
		if (def.label !== `Personalizado ${n}`) entry.label = def.label;
		if (def.icon !== `mdi:numeric-${n}-circle-outline`) entry.icon = def.icon;
		customModes[id] = {
			...entry,
			...serializePad(def.pad, pad())
		};
	}
	const buttons = {};
	for (const [id, def] of Object.entries(DEFAULT_BUTTONS)) {
		const b = s.buttons[id];
		const entry = {};
		if (b.icon !== (def.icon ?? null) && b.icon !== null) entry.icon = b.icon;
		if (!sameJson(b.action, parseAction(def.action))) entry.action = serializeAction(b.action);
		if (Object.keys(entry).length) buttons[id] = entry;
	}
	return {
		modes: [...s.modes],
		custom_modes: customModes,
		default_pad: serializePad(s.defaultPad, DEFAULT_PAD),
		streaming: s.streaming.map((slot) => {
			const entry = { source: slot.source.id };
			if (slot.icon !== slot.source.icon) entry.icon = slot.icon;
			if (slot.action) entry.action = serializeAction(slot.action);
			if (slot.accent) entry.accent = slot.accent;
			return entry;
		}),
		buttons
	};
}
function serializeV4(raw) {
	const model = normalizeConfig(raw);
	const global = serializeSettings(resolveSettings(raw, []));
	const isDefaultStreaming = global.streaming.every((e, i) => sameJson(e, { source: DEFAULT_STREAMING[i] }));
	const out = {};
	if (typeof raw.type === "string" && raw.type.startsWith("custom:")) out.type = raw.type;
	if (!model.cardId.startsWith("auto:")) out.card_id = model.cardId;
	if (model.style !== STYLES[0]) out.style = model.style;
	if (model.theme !== "dark") out.theme = model.theme;
	if (model.controlModeEntity) out.control_mode_entity = model.controlModeEntity;
	out.tvs = model.tvs.map((tv) => {
		const entry = {
			name: tv.name,
			entity: tv.entity,
			platform: tv.platform
		};
		if (tv.companion) {
			entry.companion = {};
			if (tv.companion.platform !== "roku") entry.companion.platform = tv.companion.platform;
			if (tv.companion.entity) entry.companion.media_entity = tv.companion.entity;
			if (tv.companion.remote) entry.companion.remote_entity = tv.companion.remote;
		}
		const own = serializeSettings(tv.settings);
		const overrides = {};
		for (const k of Object.keys(own)) if (!sameJson(own[k], global[k])) overrides[k] = own[k];
		if (Object.keys(overrides).length) entry.overrides = overrides;
		return entry;
	});
	out.modes = global.modes;
	if (Object.keys(global.custom_modes).length) out.custom_modes = global.custom_modes;
	if (Object.keys(global.default_pad).length) out.default_pad = global.default_pad;
	if (!isDefaultStreaming) out.streaming = global.streaming;
	if (Object.keys(global.buttons).length) out.buttons = global.buttons;
	for (const k of HA_CARD_KEYS) if (raw[k] !== void 0) out[k] = clone(raw[k]);
	return out;
}
var HA_CARD_KEYS = [
	"grid_options",
	"layout_options",
	"view_layout",
	"visibility",
	"card_mod"
];
// src/editor/ops.js
function applyFormChange(rawConfig, node, data) {
	let config = expandShortcuts(rawConfig);
	if (node.init && getPath(config, node.init.path) === void 0) config = setPath(config, node.init.path, clone(node.init.value));
	switch (node.codec) {
		case "action": return setPath(config, node.path, formToAction(data, getPath(config, node.path)));
		case "modes": {
			const modes = [
				"m1",
				"m2",
				"m3"
			].map((k) => data[k] ?? node.data[k]).filter(Boolean);
			return setPath(config, [...node.path, "modes"], modes);
		}
		case "palette-ref":
		case "palette-meta":
		case "palette-color":
		case "palette-copy": return applyPaletteForm(config, node, data);
		default: {
			let out = config;
			for (const name of fieldNames(node.schema)) {
				const value = data[name];
				if (sameJson(value, node.data[name])) continue;
				const empty = value === void 0 || value === null || value === "" || node.defaults?.[name] === value;
				out = setPath(out, [...node.path, name], empty ? void 0 : value);
			}
			return out;
		}
	}
}
function applyOp(rawConfig, op) {
	const config = expandShortcuts(rawConfig);
	switch (op.op) {
		case "set": return setPath(config, op.path, clone(op.value));
		case "delete": return deletePath(config, op.path);
		case "unset":
			if (getPath(config, op.path) === void 0) return config;
			return op.keys.reduce((c, k) => setPath(c, [...op.path, k], void 0), config);
		case "push": {
			const arr = getPath(config, op.path);
			return setPath(config, op.path, [...Array.isArray(arr) ? arr : [], clone(op.value)]);
		}
		case "remove": {
			const arr = [...getPath(config, op.path) ?? []];
			arr.splice(op.index, 1);
			return setPath(config, op.path, arr);
		}
		case "move": {
			const arr = [...getPath(config, op.path) ?? []];
			const j = op.index + op.delta;
			if (j < 0 || j >= arr.length) return config;
			[arr[op.index], arr[j]] = [arr[j], arr[op.index]];
			return setPath(config, op.path, arr);
		}
		case "palette-delete": return removePalette(config, op.name);
		case "convert": return serializeV4(rawConfig);
		default: return config;
	}
}
// src/editor/styles.js
var EDITOR_CSS = `
:host { display: block; }
.ed { display: grid; gap: 8px; padding-bottom: 16px; }
.ed-h { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.ed-h span { flex: 1; min-width: 0; }
.ed-h.l1 { font-size: 1.05rem; margin-top: 18px; padding-bottom: 6px; border-bottom: 1px solid var(--divider-color, rgb(127 127 127 / 0.3)); }
.ed-h.l2 { font-size: 0.95rem; margin-top: 10px; }
.ed-h.l3 { font-size: 0.85rem; font-weight: 500; opacity: 0.8; margin-top: 4px; }
.ed-h.litem { font-weight: 400; font-size: 0.9rem; }
.ed-note { font-size: 0.8rem; opacity: 0.7; }
.ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.ed button {
  font: inherit; font-size: 0.82rem; padding: 5px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--divider-color, rgb(127 127 127 / 0.4));
  background: var(--secondary-background-color, transparent); color: var(--primary-text-color, inherit);
}
.ed button:disabled { opacity: 0.35; cursor: default; }
.ed-h button { padding: 2px 9px; }
.ed-alert { padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; border-inline-start: 4px solid; background: rgb(127 127 127 / 0.08); }
.ed-alert.error { border-color: var(--error-color, #db4437); }
.ed-alert.warning { border-color: var(--warning-color, #ffa600); }
.ed-alert.info { border-color: var(--info-color, #039be5); }
.ed-alert .ed-btns { margin-top: 8px; }

.ed-swatches { display: flex; gap: 8px; }
.ed-sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--divider-color, rgb(127 127 127 / 0.5)); box-sizing: border-box; }
.ed-sw.base { border-style: dashed; opacity: 0.6; }

.ed-fold { border: 1px solid var(--divider-color, rgb(127 127 127 / 0.3)); border-radius: 12px; background: var(--card-background-color, transparent); }
.ed-fold .ed-fold { background: var(--secondary-background-color, rgb(127 127 127 / 0.06)); }
.ed-fold > summary { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; list-style: none; border-radius: 12px; }
.ed-fold > summary::-webkit-details-marker { display: none; }
.ed-fold > summary::before {
  content: ''; flex: none; width: 7px; height: 7px; opacity: 0.6;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: rotate(-45deg); transition: transform 0.15s;
}
.ed-fold[open] > summary::before { transform: rotate(45deg); }
.ed-fold > summary:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: -2px; }
.ed-fold-main { flex: 1; min-width: 0; display: grid; }
.ed-fold-title { font-weight: 600; font-size: 0.95rem; }
.ed-fold.l1 > summary .ed-fold-title { font-size: 1.02rem; }
.ed-fold.l3 > summary .ed-fold-title { font-weight: 500; font-size: 0.88rem; }
.ed-fold-sum { font-size: 0.78rem; opacity: 0.65; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-fold-body { display: grid; gap: 8px; padding: 2px 12px 12px; }
@media (prefers-reduced-motion: reduce) { .ed-fold > summary::before { transition: none; } }
`;
// src/editor/view.js
function listActions(arrayPath, index, length, { canRemove = true } = {}) {
	return [
		{
			label: "↑",
			title: "Subir",
			op: {
				op: "move",
				path: arrayPath,
				index,
				delta: -1
			},
			disabled: index === 0
		},
		{
			label: "↓",
			title: "Bajar",
			op: {
				op: "move",
				path: arrayPath,
				index,
				delta: 1
			},
			disabled: index === length - 1
		},
		{
			label: "✕",
			title: "Quitar",
			op: {
				op: "remove",
				path: arrayPath,
				index
			},
			disabled: !canRemove
		}
	];
}
function shortLabel(options, value) {
	const found = options.find((o) => o.value === value);
	return found ? found.label.replace(/ \(.*\)$/, "") : String(value ?? "");
}
var ACTION_SHORT = {
	input: "entrada",
	source: "fuente",
	script: "script",
	service: "servicio de HA",
	command: "command LG",
	button: "botón crudo",
	sequence: "secuencia",
	numpad: "teclado numérico",
	platform: "distinta por marca"
};
function describeAction(raw, { allowDefault = false, defaultText = "predeterminada" } = {}) {
	const form = actionToForm(raw);
	if (form.type === "default") return allowDefault ? defaultText : "sin acción";
	if (form.type === "none") return "sin acción";
	if (form.type === "key") return form.key ? `tecla ${KEYS[form.key]?.label ?? form.key}` : "tecla sin elegir";
	return ACTION_SHORT[form.type] ?? ACTION_UI_TYPES[form.type] ?? form.type;
}
var OVERRIDE_NAMES = {
	modes: "modos",
	custom_modes: "modos personalizados",
	default_pad: "touchpad",
	streaming: "streaming",
	buttons: "botones",
	palette: "paleta"
};
var plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function actionNodes(config, path, key, depth, opts = {}) {
	const raw = getPath(config, path);
	const form = actionToForm(raw);
	if (!opts.allowDefault && form.type === "default") form.type = "none";
	const nodes = [{
		kind: "form",
		key,
		depth,
		path,
		codec: "action",
		schema: actionSchema(form, opts),
		data: form
	}];
	if (form.type === "sequence") {
		const stepsPath = Array.isArray(raw) ? path : [...path, "steps"];
		const steps = getPath(config, stepsPath) ?? [];
		steps.forEach((_, j) => {
			nodes.push({
				kind: "heading",
				key: `${key}.s${j}`,
				depth: depth + 1,
				level: 3,
				text: `Paso ${j + 1}`,
				actions: listActions(stepsPath, j, steps.length)
			});
			nodes.push(...actionNodes(config, [...stepsPath, j], `${key}.s${j}.a`, depth + 1, {
				types: STEP_ACTION_TYPES,
				allowNone: false
			}));
		});
		nodes.push({
			kind: "buttons",
			key: `${key}.addstep`,
			depth: depth + 1,
			items: [{
				label: "+ Agregar paso",
				op: {
					op: "push",
					path: stepsPath,
					value: {
						type: "key",
						key: ""
					}
				}
			}]
		});
	}
	if (form.type === "platform") {
		const by = isPlainObject(raw?.by) ? raw.by : {};
		for (const [brand, label] of BRANDS) {
			if (!(brand in by)) continue;
			nodes.push({
				kind: "heading",
				key: `${key}.b.${brand}`,
				depth: depth + 1,
				level: 3,
				text: label,
				actions: [{
					label: "✕",
					title: "Quitar",
					op: {
						op: "delete",
						path: [
							...path,
							"by",
							brand
						]
					}
				}]
			});
			nodes.push(...actionNodes(config, [
				...path,
				"by",
				brand
			], `${key}.b.${brand}.a`, depth + 1, { types: BRAND_ACTION_TYPES }));
		}
		const missing = BRANDS.filter(([brand]) => !(brand in by));
		if (missing.length) nodes.push({
			kind: "buttons",
			key: `${key}.addbrand`,
			depth: depth + 1,
			items: missing.map(([brand, label]) => ({
				label: `+ ${label}`,
				op: {
					op: "set",
					path: [
						...path,
						"by",
						brand
					],
					value: {
						type: "key",
						key: ""
					}
				}
			}))
		});
	}
	return nodes;
}
function padNodes(config, basePath, key, depth, { allowDefault }) {
	const nodes = [];
	for (const dir of DIRECTIONS) {
		const entry = getPath(config, [...basePath, dir]);
		const defaultKey = KEYS[DEFAULT_PAD[dir].action.key].label;
		const defaultLabel = allowDefault ? `Predeterminada (${defaultKey})` : void 0;
		const head = {
			kind: "heading",
			key: `${key}.${dir}`,
			depth,
			level: 3,
			text: DIRECTION_LABELS[dir]
		};
		const children = [{
			kind: "form",
			key: `${key}.${dir}.i`,
			depth,
			path: [...basePath, dir],
			schema: [{
				name: "icon",
				label: "Ícono",
				selector: { icon: {} }
			}],
			data: { icon: entry?.icon ?? "" }
		}, ...actionNodes(config, [
			...basePath,
			dir,
			"action"
		], `${key}.${dir}.a`, depth, {
			allowDefault,
			defaultLabel
		})];
		nodes.push(...fold(head, children, { summary: describeAction(entry?.action, {
			allowDefault,
			defaultText: `tecla ${defaultKey} (predeterminada)`
		}) }));
	}
	return nodes;
}
function describeDefaultButton(id) {
	const action = parseAction(DEFAULT_BUTTONS[id].action);
	if (id === "power") return "encender/apagar la TV";
	return action?.type === "key" ? `tecla ${KEYS[action.key].label}` : "sin acción";
}
function settingsNodes(config, base, kp, depth, ctx, override) {
	const nodes = [];
	const here = getPath(config, base) ?? {};
	const present = (k) => here[k] !== void 0;
	const level = override ? 2 : 1;
	const effectiveModes = (present("modes") ? here.modes : config.modes) ?? DEFAULT_MODES;
	const customDefs = override && here.custom_modes || config.custom_modes || {};
	const modeLabel = (id) => FIXED_MODES[id]?.label ?? customDefs[id]?.label ?? id;
	let modesHead = null;
	const modesChildren = [];
	if (!override || present("modes")) {
		const modeOptions = [...Object.entries(FIXED_MODES).map(([id, def]) => ({
			value: id,
			label: id === "info" ? `${def.label} (experimental)` : def.label
		})), ...CUSTOM_MODE_IDS.map((id) => ({
			value: id,
			label: customDefs[id]?.label ? `${customDefs[id].label} (${id})` : `Personalizado ${id.slice(-1)} (${id})`
		}))];
		const modes = present("modes") ? here.modes : config.modes ?? DEFAULT_MODES;
		modesHead = {
			kind: "heading",
			key: `${kp}modes`,
			depth,
			level,
			text: override ? "Modos propios" : "Modos del touchpad",
			actions: override ? [{
				label: "✕",
				title: "Usar los modos globales",
				op: {
					op: "delete",
					path: [...base, "modes"]
				}
			}] : void 0
		};
		modesChildren.push({
			kind: "form",
			key: `${kp}modes.f`,
			depth,
			path: base,
			codec: "modes",
			schema: [{
				name: "",
				type: "grid",
				schema: [
					"m1",
					"m2",
					"m3"
				].map((name, i) => ({
					name,
					label: `Modo ${i + 1}`,
					required: true,
					selector: { select: {
						mode: "dropdown",
						options: modeOptions
					} }
				}))
			}],
			data: {
				m1: modes[0],
				m2: modes[1],
				m3: modes[2]
			}
		});
	} else nodes.push({
		kind: "buttons",
		key: `${kp}modes.add`,
		depth,
		items: [{
			label: "+ Modos propios",
			op: {
				op: "set",
				path: [...base, "modes"],
				value: [...config.modes ?? DEFAULT_MODES],
				open: `${kp}modes`
			}
		}]
	});
	const customNodes = modesHead ? modesChildren : nodes;
	const usedCustom = CUSTOM_MODE_IDS.filter((id) => effectiveModes.includes(id));
	if (usedCustom.length) {
		const cmBase = override ? [...base, "custom_modes"] : ["custom_modes"];
		if (override && !present("custom_modes")) {
			customNodes.push({
				kind: "note",
				key: `${kp}cm.note`,
				depth,
				text: `${usedCustom.join(", ")}: usa la definición global.`
			});
			customNodes.push({
				kind: "buttons",
				key: `${kp}cm.add`,
				depth,
				items: [{
					label: "+ Definición propia de los modos personalizados",
					op: {
						op: "set",
						path: cmBase,
						value: clone(config.custom_modes ?? {}),
						open: `${kp}cm`
					}
				}]
			});
		} else {
			const defs = [];
			for (const id of usedCustom) {
				const n = id.slice(-1);
				const def = getPath(config, [...cmBase, id]) ?? {};
				const head = {
					kind: "heading",
					key: `${kp}cm.${id}`,
					depth,
					level: 2,
					text: `Modo ${def.label || `Personalizado ${n}`} (${id})`
				};
				const children = [{
					kind: "form",
					key: `${kp}cm.${id}.f`,
					depth,
					path: [...cmBase, id],
					schema: [{
						name: "",
						type: "grid",
						schema: [{
							name: "label",
							label: "Nombre",
							selector: { text: {} }
						}, {
							name: "icon",
							label: "Ícono del modo",
							selector: { icon: {} }
						}]
					}],
					data: {
						label: def.label ?? "",
						icon: def.icon ?? ""
					}
				}, ...padNodes(config, [...cmBase, id], `${kp}cm.${id}.pad`, depth + 1, { allowDefault: false })];
				const done = DIRECTIONS.filter((dir) => getPath(config, [
					...cmBase,
					id,
					dir,
					"action"
				]) !== void 0).length;
				defs.push(...fold(head, children, { summary: done ? `${done} de 4 direcciones definidas` : "sin direcciones definidas" }));
			}
			if (override) {
				const head = {
					kind: "heading",
					key: `${kp}cm`,
					depth,
					level: 2,
					text: "Modos personalizados propios",
					actions: [{
						label: "✕",
						title: "Usar la definición global",
						op: {
							op: "delete",
							path: cmBase
						}
					}]
				};
				customNodes.push(...fold(head, defs, { summary: usedCustom.join(", ") }));
			} else customNodes.push(...defs);
		}
	}
	if (modesHead) {
		const names = (Array.isArray(effectiveModes) ? effectiveModes : []).map(modeLabel);
		nodes.push(...fold(modesHead, modesChildren, { summary: names.join(", ") }));
	}
	if (present("default_pad")) {
		const head = {
			kind: "heading",
			key: `${kp}dp`,
			depth,
			level,
			text: "Touchpad sin modo",
			actions: [{
				label: "✕",
				title: "Volver al predeterminado (flechas)",
				op: {
					op: "delete",
					path: [...base, "default_pad"]
				}
			}]
		};
		nodes.push(...fold(head, padNodes(config, [...base, "default_pad"], `${kp}dp.pad`, depth + 1, { allowDefault: true }), { summary: "personalizado" }));
	} else {
		const add = {
			kind: "buttons",
			key: `${kp}dp.add`,
			depth,
			items: [{
				label: "+ Personalizar touchpad sin modo",
				op: {
					op: "set",
					path: [...base, "default_pad"],
					value: override ? clone(config.default_pad ?? {}) : {},
					open: `${kp}dp`
				}
			}]
		};
		if (override) nodes.push(add);
		else nodes.push(...fold({
			kind: "heading",
			key: `${kp}dp`,
			depth,
			level,
			text: "Touchpad sin modo"
		}, [add], { summary: "predeterminado (flechas)" }));
	}
	if (!override || present("streaming")) {
		const head = {
			kind: "heading",
			key: `${kp}st`,
			depth,
			level,
			text: override ? "Streaming propio" : "Botones de streaming",
			actions: override ? [{
				label: "✕",
				title: "Usar el streaming global",
				op: {
					op: "delete",
					path: [...base, "streaming"]
				}
			}] : void 0
		};
		const streamingPath = [...base, "streaming"];
		const slots = getPath(config, streamingPath) ?? [];
		const defaults = DEFAULT_STREAMING.map((source) => ({ source }));
		const children = [];
		const names = [];
		let customCount = 0;
		DEFAULT_STREAMING.forEach((defaultId, i) => {
			const entry = isPlainObject(slots[i]) ? slots[i] : {};
			const slotKey = `${kp}st.${i}`;
			const isCustom = [
				"icon",
				"action",
				"accent",
				"palette"
			].some((k) => entry[k] !== void 0);
			if (isCustom) customCount += 1;
			names.push(shortLabel(SOURCE_OPTIONS, entry.source ?? defaultId).replace(/ \(.*\)$/, ""));
			const custom = isCustom || ctx.expanded?.has(slotKey);
			const schema = [{
				name: "source",
				label: `Botón ${i + 1}`,
				selector: { select: {
					mode: "dropdown",
					options: SOURCE_OPTIONS
				} }
			}];
			if (custom) schema.push({
				name: "icon",
				label: "Ícono",
				selector: { icon: {} }
			}, {
				name: "accent",
				label: "Color",
				helper: "#e50914 o 229, 9, 20. Vacío = el color de la app.",
				selector: { text: {} }
			});
			children.push({
				kind: "form",
				key: `${slotKey}.f`,
				depth,
				path: [...streamingPath, i],
				init: {
					path: streamingPath,
					value: defaults
				},
				schema,
				data: {
					source: entry.source ?? defaultId,
					icon: entry.icon ?? "",
					accent: entry.accent ?? ""
				}
			});
			if (custom) {
				children.push(...assignmentNodes(config, [
					...streamingPath,
					i,
					"palette"
				], `${slotKey}.pal`, depth + 1, "Paleta de este botón", { init: {
					path: streamingPath,
					value: defaults
				} }));
				children.push(...actionNodes(config, [
					...streamingPath,
					i,
					"action"
				], `${slotKey}.a`, depth + 1, {
					allowDefault: true,
					defaultLabel: "Predeterminada (abrir la fuente)",
					types: ALL_ACTION_TYPES.filter((t) => t !== "numpad")
				}));
				children.push({
					kind: "buttons",
					key: `${slotKey}.b`,
					depth: depth + 1,
					items: [{
						label: "Quitar personalización",
						op: {
							op: "unset",
							path: [...streamingPath, i],
							keys: [
								"icon",
								"action",
								"accent",
								"palette"
							],
							collapse: slotKey
						}
					}]
				});
			} else children.push({
				kind: "buttons",
				key: `${slotKey}.b`,
				depth: depth + 1,
				items: [{
					label: "Personalizar ícono, color o acción",
					op: {
						op: "expand",
						key: slotKey
					}
				}]
			});
		});
		nodes.push(...fold(head, children, { summary: `${names.join(", ")}${customCount ? ` · ${plural(customCount, "personalizado", "personalizados")}` : ""}` }));
	} else nodes.push({
		kind: "buttons",
		key: `${kp}st.add`,
		depth,
		items: [{
			label: "+ Streaming propio",
			op: {
				op: "set",
				path: [...base, "streaming"],
				value: clone(config.streaming ?? DEFAULT_STREAMING.map((source) => ({ source }))),
				open: `${kp}st`
			}
		}]
	});
	if (!override || present("buttons")) {
		const head = {
			kind: "heading",
			key: `${kp}bt`,
			depth,
			level,
			text: override ? "Botones propios" : "Botones",
			actions: override ? [{
				label: "✕",
				title: "Usar los botones globales",
				op: {
					op: "delete",
					path: [...base, "buttons"]
				}
			}] : void 0
		};
		const buttons = getPath(config, [...base, "buttons"]) ?? {};
		const children = [];
		const changed = [];
		for (const id of Object.keys(DEFAULT_BUTTONS)) {
			const bKey = `${kp}bt.${id}`;
			const entry = buttons[id];
			if (entry === void 0) {
				children.push({
					kind: "heading",
					key: bKey,
					depth,
					level: "item",
					text: `${BUTTON_LABELS[id]}: ${describeDefaultButton(id)}`,
					actions: [{
						label: "Personalizar",
						op: {
							op: "set",
							path: [
								...base,
								"buttons",
								id
							],
							value: {},
							open: bKey
						}
					}]
				});
				continue;
			}
			changed.push(BUTTON_LABELS[id]);
			const bHead = {
				kind: "heading",
				key: bKey,
				depth,
				level: 2,
				text: BUTTON_LABELS[id],
				actions: [{
					label: "Restablecer",
					title: "Volver al predeterminado",
					op: {
						op: "delete",
						path: [
							...base,
							"buttons",
							id
						]
					}
				}]
			};
			const bChildren = [];
			if (id === "top_left") bChildren.push({
				kind: "note",
				key: `${bKey}.n`,
				depth,
				text: "Si solo manda Salir se oculta (ya está abajo). Con Roku, su lugar lo ocupa el selector TV | Roku."
			});
			bChildren.push({
				kind: "form",
				key: `${bKey}.i`,
				depth,
				path: [
					...base,
					"buttons",
					id
				],
				schema: [{
					name: "icon",
					label: "Ícono",
					selector: { icon: {} }
				}],
				data: { icon: entry?.icon ?? "" }
			});
			bChildren.push(...actionNodes(config, [
				...base,
				"buttons",
				id,
				"action"
			], `${bKey}.a`, depth, {
				allowDefault: true,
				defaultLabel: `Predeterminada (${describeDefaultButton(id)})`
			}));
			children.push(...fold(bHead, bChildren, { summary: describeAction(entry?.action, {
				allowDefault: true,
				defaultText: describeDefaultButton(id)
			}) }));
		}
		nodes.push(...fold(head, children, { summary: changed.length ? `${plural(changed.length, "personalizado", "personalizados")}: ${changed.join(", ")}` : "todos predeterminados" }));
	} else nodes.push({
		kind: "buttons",
		key: `${kp}bt.add`,
		depth,
		items: [{
			label: "+ Botones propios",
			op: {
				op: "set",
				path: [...base, "buttons"],
				value: clone(config.buttons ?? {}),
				open: `${kp}bt`
			}
		}]
	});
	return nodes;
}
function buildEditorView(rawConfig, ctx = {}) {
	const config = expandShortcuts(rawConfig);
	const nodes = [];
	if (ctx.error) nodes.push({
		kind: "alert",
		key: "error",
		level: "error",
		text: ctx.error
	});
	if (ctx.model?.format === "legacy") {
		nodes.push({
			kind: "alert",
			key: "legacy",
			level: "warning",
			text: "Esta tarjeta usa el formato viejo (v3). El editor visual solo edita el formato v4. Convertirla reescribe el YAML en el formato nuevo con la misma configuración; la tarjeta se comporta igual.",
			actions: [{
				label: "Convertir a formato v4",
				op: { op: "convert" }
			}]
		});
		return nodes;
	}
	(ctx.model?.warnings ?? []).forEach((text, i) => nodes.push({
		kind: "alert",
		key: `warn${i}`,
		level: "info",
		text
	}));
	const generalHead = {
		kind: "heading",
		key: "general",
		depth: 0,
		level: 1,
		text: "General"
	};
	const general = [];
	general.push({
		kind: "form",
		key: "general.f",
		depth: 0,
		path: [],
		defaults: {
			style: "relieve",
			theme: "dark"
		},
		schema: [{
			name: "card_id",
			label: "ID de la tarjeta",
			helper: "Para recordar la TV elegida por cada usuario. Único por tarjeta.",
			selector: { text: {} }
		}, {
			name: "",
			type: "grid",
			schema: [{
				name: "style",
				label: "Estilo",
				selector: { select: {
					mode: "dropdown",
					options: STYLE_OPTIONS
				} }
			}, {
				name: "theme",
				label: "Tema",
				selector: { select: {
					mode: "dropdown",
					options: THEME_OPTIONS
				} }
			}]
		}],
		data: {
			card_id: config.card_id ?? "",
			style: config.style ?? "relieve",
			theme: config.theme ?? "dark"
		}
	});
	general.push(...assignmentNodes(config, ["palette"], "general.pal", 0, "Paleta de la tarjeta"));
	if (config.control_mode_entity !== void 0 || ctx.expanded?.has("cme")) {
		general.push({
			kind: "heading",
			key: "cme",
			depth: 0,
			level: 3,
			text: "Entidad de modo",
			actions: [{
				label: "✕",
				title: "Quitar",
				op: {
					op: "delete",
					path: ["control_mode_entity"],
					collapse: "cme"
				}
			}]
		});
		general.push({
			kind: "form",
			key: "cme.f",
			depth: 0,
			path: [],
			schema: [{
				name: "control_mode_entity",
				label: "input_select",
				helper: "Sincroniza el modo activo con un input_select (sus opciones: menu, audio, custom1…).",
				selector: { entity: { filter: { domain: "input_select" } } }
			}],
			data: { control_mode_entity: config.control_mode_entity ?? "" }
		});
	} else general.push({
		kind: "buttons",
		key: "cme.add",
		depth: 0,
		items: [{
			label: "+ Entidad de modo (input_select)",
			op: {
				op: "expand",
				key: "cme"
			}
		}]
	});
	const paletteName = typeof config.palette === "string" ? config.palette : isPlainObject(config.palette) ? "paleta claro/oscuro" : "";
	const generalSummary = [
		config.card_id,
		shortLabel(STYLE_OPTIONS, config.style ?? "relieve"),
		shortLabel(THEME_OPTIONS, config.theme ?? "dark"),
		paletteName
	].filter(Boolean).join(" · ");
	nodes.push(...fold(generalHead, general, {
		summary: generalSummary,
		open: true
	}));
	const tvsHead = {
		kind: "heading",
		key: "tvs",
		depth: 0,
		level: 1,
		text: "Televisores"
	};
	const tvNodes = [];
	const tvs = Array.isArray(config.tvs) ? config.tvs : [];
	tvs.forEach((tv, i) => {
		const t = isPlainObject(tv) ? tv : {};
		const kp = `tv${i}.`;
		const tvHead = {
			kind: "heading",
			key: `${kp}h`,
			depth: 0,
			level: 2,
			text: `TV ${i + 1}${t.name ? ` · ${t.name}` : ""}`,
			actions: listActions(["tvs"], i, tvs.length, { canRemove: tvs.length > 1 })
		};
		const children = [];
		children.push({
			kind: "form",
			key: `${kp}f`,
			depth: 1,
			path: ["tvs", i],
			schema: [{
				name: "",
				type: "grid",
				schema: [{
					name: "name",
					label: "Nombre",
					selector: { text: {} }
				}, {
					name: "platform",
					label: "Marca",
					selector: { select: {
						mode: "dropdown",
						options: TV_PLATFORM_OPTIONS
					} }
				}]
			}, {
				name: "entity",
				label: "Entidad de la TV",
				required: true,
				selector: { entity: { filter: { domain: "media_player" } } }
			}],
			data: {
				name: t.name ?? "",
				entity: t.entity ?? "",
				platform: t.platform ?? normalizePlatform(t.type)
			}
		});
		children.push(...assignmentNodes(config, [
			"tvs",
			i,
			"overrides",
			"palette"
		], `${kp}pal`, 1, "Paleta de esta TV"));
		const adds = [];
		if (t.companion === void 0) adds.push({
			label: "+ Roku conectado",
			op: {
				op: "set",
				path: [
					"tvs",
					i,
					"companion"
				],
				value: {}
			}
		});
		if (t.overrides === void 0) adds.push({
			label: "+ Configuración propia de esta TV",
			op: {
				op: "set",
				path: [
					"tvs",
					i,
					"overrides"
				],
				value: {},
				open: `${kp}ov`
			}
		});
		if (adds.length) children.push({
			kind: "buttons",
			key: `${kp}add`,
			depth: 1,
			items: adds
		});
		if (t.companion !== void 0) {
			children.push({
				kind: "heading",
				key: `${kp}rk`,
				depth: 1,
				level: 3,
				text: "Roku conectado",
				actions: [{
					label: "✕",
					title: "Quitar el Roku",
					op: {
						op: "delete",
						path: [
							"tvs",
							i,
							"companion"
						]
					}
				}]
			});
			const c = isPlainObject(t.companion) ? t.companion : {};
			children.push({
				kind: "form",
				key: `${kp}rk.f`,
				depth: 1,
				path: [
					"tvs",
					i,
					"companion"
				],
				schema: [{
					name: "",
					type: "grid",
					schema: [{
						name: "media_entity",
						label: "media_player del Roku",
						selector: { entity: { filter: { domain: "media_player" } } }
					}, {
						name: "remote_entity",
						label: "remote del Roku",
						selector: { entity: { filter: { domain: "remote" } } }
					}]
				}],
				data: {
					media_entity: c.media_entity ?? c.entity ?? "",
					remote_entity: c.remote_entity ?? c.remote ?? ""
				}
			});
			children.push(...assignmentNodes(config, [
				"tvs",
				i,
				"companion",
				"palette"
			], `${kp}rk.pal`, 1, "Paleta del modo Roku"));
		}
		if (t.overrides !== void 0) {
			const ovHead = {
				kind: "heading",
				key: `${kp}ov`,
				depth: 1,
				level: 2,
				text: "Configuración propia de esta TV",
				actions: [{
					label: "✕",
					title: "Quitar: usar la configuración global",
					op: {
						op: "delete",
						path: [
							"tvs",
							i,
							"overrides"
						]
					}
				}]
			};
			const ovChildren = [{
				kind: "note",
				key: `${kp}ov.n`,
				depth: 1,
				text: "Lo que agregues aquí reemplaza a la configuración global solo para esta TV."
			}, ...settingsNodes(config, [
				"tvs",
				i,
				"overrides"
			], `${kp}ov.`, 1, ctx, true)];
			const own = Object.entries(OVERRIDE_NAMES).filter(([k]) => isPlainObject(t.overrides) && t.overrides[k] !== void 0).map(([, name]) => name);
			children.push(...fold(ovHead, ovChildren, { summary: own.length ? own.join(", ") : "sin cambios todavía" }));
		}
		const tvSummary = [
			shortLabel(TV_PLATFORM_OPTIONS, t.platform ?? normalizePlatform(t.type)),
			t.entity || "sin entidad",
			t.companion !== void 0 && "con Roku",
			t.overrides !== void 0 && "config. propia"
		].filter(Boolean).join(" · ");
		tvNodes.push(...fold(tvHead, children, {
			summary: tvSummary,
			open: i === 0
		}));
	});
	const used = new Set(tvs.map((tv) => tv?.entity));
	const suggestion = (ctx.mediaPlayers ?? []).find((id) => !used.has(id)) ?? "";
	tvNodes.push({
		kind: "buttons",
		key: "tvs.add",
		depth: 0,
		items: [{
			label: "+ Agregar TV",
			op: {
				op: "push",
				path: ["tvs"],
				value: {
					name: "",
					entity: suggestion,
					platform: "lg"
				},
				open: `tv${tvs.length}.h`
			}
		}]
	});
	nodes.push(...fold(tvsHead, tvNodes, {
		summary: plural(tvs.length, "TV", "TVs"),
		open: true
	}));
	nodes.push(...settingsNodes(config, [], "", 0, ctx, false));
	nodes.push(...paletteSection(config));
	return nodes;
}
// src/editor/tv-control-card-editor.js
var haFormReady = null;
function ensureHaForm() {
	if (globalThis.customElements?.get("ha-form")) return Promise.resolve();
	haFormReady ??= (async () => {
		try {
			await (await (await window.loadCardHelpers?.())?.createCardElement({
				type: "entities",
				entities: []
			}))?.constructor?.getConfigElement?.();
		} catch {}
		await customElements.whenDefined("ha-form");
	})();
	return haFormReady;
}
var computeLabel = (s) => s.label ?? s.name;
var computeHelper = (s) => s.helper;
var TvControlCardEditor = class extends i$3 {
	static properties = {
		_config: { state: true },
		_formReady: { state: true }
	};
	static styles = r$3(EDITOR_CSS);
	constructor() {
		super();
		this._config = null;
		this._formReady = false;
		this._hass = null;
		this._expanded = /* @__PURE__ */ new Set();
		this._open = /* @__PURE__ */ new Map();
		this._schemas = /* @__PURE__ */ new Map();
	}
	setConfig(config) {
		this._config = config;
	}
	set hass(hass) {
		const first = !this._hass;
		this._hass = hass;
		for (const form of this.renderRoot?.querySelectorAll?.("ha-form") ?? []) form.hass = hass;
		if (first) this.requestUpdate();
	}
	get hass() {
		return this._hass;
	}
	connectedCallback() {
		super.connectedCallback();
		ensureHaForm().then(() => {
			this._formReady = true;
		});
	}
	render() {
		if (!this._config || !this._formReady) return A;
		let model = null;
		let error = null;
		try {
			model = normalizeConfig(this._config);
		} catch (err) {
			error = err.message;
		}
		const mediaPlayers = Object.keys(this._hass?.states ?? {}).filter((id) => id.startsWith("media_player."));
		const nodes = buildEditorView(this._config, {
			model,
			error,
			expanded: this._expanded,
			mediaPlayers
		});
		return b`<div class="ed">${this._renderChildren(childrenByParent(nodes), null)}</div>`;
	}
	_renderChildren(tree, parent) {
		const base = parent?.fold.base ?? 0;
		return c(tree.get(parent?.key ?? "") ?? [], (node) => node.key, (node) => node.fold ? this._renderFold(node, tree, base) : this._renderNode(node, base));
	}
	_isOpen(node) {
		return this._open.has(node.key) ? this._open.get(node.key) : node.fold.open;
	}
	_renderFold(node, tree, base) {
		const open = this._isOpen(node);
		const indent = `margin-inline-start: ${Math.max(0, (node.depth ?? 0) - base) * 16}px`;
		return b`<details class="ed-fold l${node.level}" data-key=${node.key} style=${indent} ?open=${open}>
      <summary @click=${(e) => this._toggleFold(e, node)}>
        <span class="ed-fold-main">
          <span class="ed-fold-title">${node.text}</span>
          ${node.fold.summary ? b`<span class="ed-fold-sum">${node.fold.summary}</span>` : A}
        </span>
        ${(node.actions ?? []).map((item) => this._renderButton(item))}
      </summary>
      ${open ? b`<div class="ed-fold-body">${this._renderChildren(tree, node)}</div>` : A}
    </details>`;
	}
	_toggleFold(e, node) {
		e.preventDefault();
		this._open.set(node.key, !this._isOpen(node));
		this.requestUpdate();
	}
	_schemaFor(node) {
		const json = JSON.stringify(node.schema);
		const cached = this._schemas.get(node.key);
		if (cached?.json === json) return cached.schema;
		this._schemas.set(node.key, {
			json,
			schema: node.schema
		});
		return node.schema;
	}
	_renderNode(node, base = 0) {
		const indent = `margin-inline-start: ${Math.max(0, (node.depth ?? 0) - base) * 16}px`;
		switch (node.kind) {
			case "form": return b`<ha-form
          data-key=${node.key}
          style=${indent}
          .hass=${this._hass}
          .schema=${this._schemaFor(node)}
          .data=${node.data}
          .computeLabel=${computeLabel}
          .computeHelper=${computeHelper}
          @value-changed=${(e) => this._onFormChange(e, node)}
        ></ha-form>`;
			case "swatches": return b`<div class="ed-swatches" data-key=${node.key} style=${indent}>${node.colors.map((c) => b`<span
          class="ed-sw ${c.base ? "base" : ""}" style="background:${c.color}"
          title="${c.label}: ${c.color}${c.base ? " (de la base)" : ""}"></span>`)}</div>`;
			case "heading": return b`<div class="ed-h l${node.level}" data-key=${node.key} style=${indent}>
          <span>${node.text}</span>${(node.actions ?? []).map((item) => this._renderButton(item))}
        </div>`;
			case "alert": return b`<div class="ed-alert ${node.level}" data-key=${node.key} style=${indent}>
          <div>${node.text}</div>
          ${node.actions?.length ? b`<div class="ed-btns">${node.actions.map((item) => this._renderButton(item))}</div>` : A}
        </div>`;
			case "buttons": return b`<div class="ed-btns" data-key=${node.key} style=${indent}>${node.items.map((item) => this._renderButton(item))}</div>`;
			default: return b`<div class="ed-${node.kind}" data-key=${node.key} style=${indent}>${node.text}</div>`;
		}
	}
	_renderButton(item) {
		return b`<button type="button" title=${item.title ?? A} ?disabled=${!!item.disabled}
      @click=${(e) => {
			e.preventDefault();
			e.stopPropagation();
			this._onOp(item.op);
		}}>${item.label}</button>`;
	}
	_onFormChange(e, node) {
		e.stopPropagation();
		const next = applyFormChange(this._config, node, e.detail.value);
		if (node.open && !sameJson(next, this._config)) this._open.set(node.open, true);
		this._commit(next);
	}
	_onOp(op) {
		if (op.open) this._open.set(op.open, true);
		if (op.op === "expand") {
			this._expanded.add(op.key);
			this.requestUpdate();
			return;
		}
		if (op.collapse) this._expanded.delete(op.collapse);
		this._commit(applyOp(this._config, op));
	}
	_commit(next) {
		if (sameJson(next, this._config)) {
			this.requestUpdate();
			return;
		}
		this._config = next;
		this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: next },
			bubbles: true,
			composed: true
		}));
	}
};
// src/index.js
setCardTag(tagFromUrl(import.meta.url));
var inBrowser = typeof window !== "undefined" && !!globalThis.customElements;
if (inBrowser && !customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, TvControlCardEditor);
if (inBrowser && !customElements.get(CARD_TAG)) {
	customElements.define(CARD_TAG, TvControlCard);
	window.customCards = window.customCards || [];
	if (!window.customCards.some((c) => c.type === CARD_TAG)) window.customCards.push({
		type: CARD_TAG,
		name: CARD_TAG === "tv-control-card" ? "Minimalist TV Control Card" : `Minimalist TV Control Card (${CARD_TAG})`,
		description: "Control para TVs LG y Samsung, con Roku opcional.",
		preview: false,
		documentationURL: "https://github.com/extraiotpruebas/minimalist-tv-control-card"
	});
	console.info(`%c TV-CONTROL-CARD %c ${CARD_VERSION} `, "background:#0a84ff;color:#fff;border-radius:3px 0 0 3px", "background:#333;color:#fff;border-radius:0 3px 3px 0");
}
export { BUILTIN_PALETTES, CARD_VERSION, CODE_TO_KEY, DEFAULT_BUTTONS, FIXED_MODES, HOLDABLE_KEYS, KEYS, PALETTE_FIELDS, PLATFORMS, SOURCES, STYLES, StateWaiters, TV_ONLY_KEYS, TvControlCard, UnsupportedActionError, actionToForm, applyFormChange, applyOp, buildEditorView, childrenByParent, contrastRatio, deletePath, describeNow, executeAction, formToAction, getPath, getPlatform, isHoldable, mapPaletteRefs, normalizeConfig, normalizeHex, paletteRef, paletteTokens, parseAction, removePalette, renamePalette, renameRef, resolveForPlatform, resolvePalette, resolveSourceName, routeAction, serializeV4, setPath, sourceMatches, stripSsap, tvStatus };
