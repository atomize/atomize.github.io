	/*docmd 
	# Examples
	To turn a code files comments in to a tutorial that will be parsed for markdown, simply include the ` ``data-tutorial="SEPARATOR"`` ` attribute on your` ` `pre`` ` element.
	 The ` ``SEPARATOR`` ` is any string of characters that you will append to the comment string to initiate it as a tutorial section. For example, if our separator was 'tutorial' and we were writing and inline comment in Javascript, 
	it would look like:
	>
	>
	#### //tutorial # This would be an h1 element!
	>
	>
	And a multiline comment in Javascript would like like:
	ENDdocmd*/
	/*tutorial
	# I am an h1
	ENDtutorial*/
	//docmd ## Here is this plugins code:
	(function () {
		if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
			return;
		}
		var isTut = false
		var tutSep;
		var commentArr = []
		
		var dataStarts = function (text) {
			return findDataStarts(text.trim(), new RegExp('^[^A-Z^a-z]+[^\s+' + tutSep + ']' + tutSep, 'm'))
		}
		/*docmd 
		## Built-in Markdown Parser: [Snarkdown](https://github.com/developit/snarkdown)
		### Snarkdown is a single function parser that minifies just under 2kb. 
		That's just small enough to build in to solutions like this. 
		>
		>
		**Note:** Snarkdown does not support tables!
		ENDdocmd*/
		var TAGS = {
			'': ['<em>', '</em>'],
			_: ['<strong>', '</strong>'],
			'~': ['<s>', '</s>'],
			'\n': ['<br />'],
			' ': ['<br />'],
			'-': ['<hr />']
		};

		function outdent(str) {
			return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '');
		}

		function encodeAttr(str) {
			return (str + '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		function parse(md, prevLinks) {
			var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^``` *(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*]|~~)/gm,
				context = [],
				out = '',
				links = prevLinks || {},
				last = 0,
				chunk, prev, token, inner, t;

			function tag(token) {
				var desc = TAGS[token.replace(/\*/g, '_')[1] || ''],
					end = context[context.length - 1] == token;
				if (!desc) return token;
				if (!desc[1]) return desc[0];
				context[end ? 'pop' : 'push'](token);
				return desc[end | 0];
			}

			function flush() {
				var str = '';
				while (context.length) str += tag(context[context.length - 1]);
				return str;
			}

			md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function (s, name, url) {
				links[name.toLowerCase()] = url;
				return '';
			}).replace(/^\n+|\n+$/g, '');

			while ((token = tokenizer.exec(md))) {
				prev = md.substring(last, token.index);
				last = tokenizer.lastIndex;
				chunk = token[0];
				if (prev.match(/[^\\](\\\\)*\\$/)) {
					// escaped
				} else if (token[6]) {
					t = token[6];
					if (t.match(/\./)) {
						token[5] = token[5].replace(/^\d+/gm, '');
					}
					inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
					if (t === '>') t = 'blockquote';
					else {
						t = t.match(/\./) ? 'ol' : 'ul';
						inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
					}
					chunk = '<' + t + '>' + inner + '</' + t + '>';
				}
				// Images:
				else if (token[8]) {
					chunk = '<img src="' + encodeAttr(token[8]) + '" alt="' + encodeAttr(token[7]) + '">';
				}
				// Links:
				else if (token[10]) {
					out = out.replace('<a>', '<a href="' + encodeAttr(token[11] || links[prev.toLowerCase()]) + '">');
					chunk = flush() + '</a>';
				} else if (token[9]) {
					chunk = '<a>';
				}
				// Headings:
				else if (token[12] || token[14]) {
					t = 'h' + (token[14] ? token[14].length : (token[13][0] === '=' ? 1 : 2));
					chunk = '<' + t + '>' + parse(token[12] || token[15], links) + '</' + t + '>';
				}
				// `code`:
				else if (token[16]) {
					chunk = '<code>' + encodeAttr(token[16]) + '</code>';
				}
				// Inline formatting: *em*, **strong** & friends
				else if (token[17] || token[1]) {
					chunk = tag(token[17] || '--');
				}
				out += prev;
				out += chunk;
			}

			return (out + md.substring(last) + flush()).trim();
		}

		//docmd ### This is an inline comment using our defined separator.
		function $$(expr, con) {
			return Array.prototype.slice.call((con || document).querySelectorAll(expr));
		}

		//docmd ## Another inline comment but now an h2.
		function findDataStarts(text, splitter) {
			var indexes = [];
			text = text.trim()
			var lines = text.split('\n')
			for (var j = 0; j < lines.length; j++) {
				lines[j].match(splitter) ? indexes.push(j + 1) : null
			}
			if (!isNaN(lines.length)) {
				indexes.push(lines.length)
			}
			var dataStarts = indexes.slice(0, -1)
			return dataStarts
		}
		/*docmd 
		# <h1>
		## <h2>
		### <h3>
		#### <h4>
		##### <h5>
		###### <h6>
		### Below is a list
		* Item 1
		* * Item 1.1
		* Item 2
		* Item 3
		There is a bug in Snarkdown that wont allow a blockquote underneath anything but a plain text line. Or, the regex I am made to sanitize the text may perhaps be buggy.
		> ## I am a block quote
		>
		> Which can be used to separate paragraphs.
		Now a regular line
		>
		>
		See how I was separated by a blockquote?
		ENDdocmd*/
		Prism.hooks.add('before-sanity-check', function (env) {
			var tutorialElement = env.element.parentNode.getAttribute('data-tutorial')
			tutSep = tutorialElement
			if (tutorialElement !== null) {
				isTut = true
			} else {
				isTut = false
			}
		});

		Prism.hooks.add('wrap', function (env) {
			if (isTut) {
				if (env.type === 'comment' && env.content.match(tutSep)) {
					var lengthEnv = env.content.split('\n')
					commentArr.push(lengthEnv.length)
					env.tag = 'remove'
					env.content = '%' + env.content.trim() + ' \n%'
					env.classes = [];
				}
			}
		});

		Prism.hooks.add('before-insert', function (env) {
			if (isTut) {
				var thisTUT = tutSep
				var pre = env.element.parentNode;
				var lineNumTest = dataStarts(env.code)
				var sum = lineNumTest.map(function (num, idx) {
					return num + commentArr[idx];
				});
				var splitCode = env.highlightedCode.split(/<remove.*>|%<\/remove>/)
				var x = 1;
				splitCode.forEach(function (els) {
					if (els.match(/^%/)) {
						var codeEl = document.createElement('div')
						var regContent = els.replace(new RegExp('^%.*' + thisTUT + '|.*' + thisTUT + '[^A-Z^a-z].*$', 'gm'), '')
							.replace(/^\s|\s*$/gm, "")
							.replace(/\n\s*\n/g, '\n')
							.replace(/^\s|\s*$/gm, "")
						codeEl.innerHTML = parse(regContent.trim())
						pre.before(codeEl)
					} else {
						if (!els.trim()) {
							return
						}
						var preEl = document.createElement('pre')
						var codeNode = document.createElement('code')
						preEl.className += "line-numbers language-" + env.language
						preEl.setAttribute('data-start', parseInt(sum[x - 1], 10))
						els = els.replace(/^\s+|\s*$/gm, "");
						codeNode.innerHTML = els.trim()
						console.log(els)
						preEl.appendChild(codeNode)
						pre.before(preEl)
						Prism.highlightAllUnder(preEl)
						x++
					}
				})
				while (pre.attributes.length > 0)
					pre.removeAttribute(pre.attributes[0].name);
				pre.innerHTML = ''
				pre.id = 'remove'
				document.getElementById('remove').remove()
			}
		});
	})();