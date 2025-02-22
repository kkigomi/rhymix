function getCkFormInstance(editor_sequence)
{
	var form = $('#ckeditor_instance_' + editor_sequence).closest('form');
	return form.length ? form[0] : null;
}

function getAutoSavedSrl(ret_obj) {
	var editor_sequence = ret_obj.editor_sequence;
	var primary_key = ret_obj.key;
	var fo_obj = getCkFormInstance(editor_sequence);

	if(ret_obj.document_srl !== 0)
	{
		fo_obj[primary_key].value = ret_obj.document_srl;
		reloadUploader(editor_sequence);
	}
}

(function($){
	"use strict";
	var default_ckeconfig = {
		bodyClass: 'rhymix_content xe_content editable',
		toolbarCanCollapse: true,
		toolbarGroups: [
			{ name: 'clipboard',   groups: [ 'undo', 'clipboard' ] },
			{ name: 'editing',     groups: [ 'find', 'selection' ] },
			{ name: 'links' },
			{ name: 'insert' },
			{ name: 'tools' },
			{ name: 'document',    groups: [ 'mode' ] },
			'/',
			{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
			{ name: 'paragraph',   groups: [ 'align', 'list', 'indent', 'blocks', 'bidi' ] },
			'/',
			{ name: 'styles' },
			{ name: 'colors' },
			{ name: 'xecomponent' },
			{ name: 'others' }
		],
		allowedContent: true,
		removePlugins: 'stylescombo,language,bidi,flash,pagebreak,exportpdf',
		removeButtons: 'Save,Preview,Print,Cut,Copy,Paste,Flash,NewPage,ExportPdf,Language',
		uiColor: '#EFF0F0'
	};

	function arrayUnique(data) {
		return $.grep(data, function(v, k){
			return (v.length && $.inArray(v, data) === k);
		});
	}

	var XeCkEditor = xe.createApp('XeCkEditor', {
		ckeconfig: {},
		editor_sequence: null,
		init : function() {
			var self = this;

			CKEDITOR.on('instanceCreated', function(evt){
				self.cast('CKEDITOR_CREATED');
			});

			CKEDITOR.on('ready', function(evt){
				self.cast('CKEDITOR_READY');
			});

			CKEDITOR.on('instanceReady', function(evt){
				self.cast('CKEDITOR_INSTANCE_READY');
			});

			CKEDITOR.on('instanceLoaded', function(evt){
				self.cast('CKEDITOR_LOADED');
			});
		},
		editorInit : function(containerEl, opts) {
			var self = this;
			var $containerEl = containerEl;
			var form = $containerEl.closest('form');
			var data = $containerEl.data();
			var editor_sequence = data.editorSequence;
			var primary_key = data.editorPrimaryKeyName;
			var primary_input = form.find("[name='" + primary_key + "']");
			var content_key = data.editorContentKeyName;
			var content_input = form.find("[name='" + content_key + "']");
			var fo_obj = getCkFormInstance(editor_sequence);

			this.ckeconfig = $.extend({}, default_ckeconfig, opts.ckeconfig || {});
			this.ckeconfig.bodyClass = this.ckeconfig.bodyClass + ' color_scheme_' + getColorScheme() +
				($('body').hasClass('cke_auto_dark_mode') ? ' cke_auto_dark_mode' : '');

			this.editor_sequence = editor_sequence;
			form.attr('editor_sequence', editor_sequence);

			if(CKEDITOR.env.mobile) CKEDITOR.env.isCompatible = true;

			// saved document(자동저장 문서)에 대한 확인
			if(typeof(fo_obj._saved_doc_title)!= "undefined") { ///<< _saved_doc_title field가 없으면 자동저장 하지 않음
				var saved_title = fo_obj._saved_doc_title.value;
				var saved_content = fo_obj._saved_doc_content.value;

				if(saved_title || saved_content) {
					// 자동저장된 문서 활용여부를 물은 후 사용하지 않는다면 자동저장된 문서 삭제
					if (confirm(fo_obj._saved_doc_message.value)) {
						if(typeof(fo_obj.title) !== 'undefined') {
							fo_obj.title.value = saved_title;
						}
						content_input.val(saved_content);
						exec_json('editor.procEditorLoadSavedDocument', {
							editor_sequence: editor_sequence,
							primary_key: primary_key,
							mid: current_mid
						}, getAutoSavedSrl);
					} else {
						editorRemoveSavedDoc();
					}
				}
			}

			var instance = CKEDITOR.appendTo($containerEl[0], {}, content_input.val());

			instance.on('customConfigLoaded', function(e) {
				instance.config = $.extend({}, e.editor.config, self.ckeconfig);

				if($.isFunction(CKEDITOR.editorConfig)) {
					var customConfig = {};
					CKEDITOR.editorConfig(customConfig);

					$.each(customConfig, function(key, val) {
						instance.config[key] = val;
					});
				}

				var bodyClass = e.editor.config.bodyClass.split(' ');
				bodyClass.push(default_ckeconfig.bodyClass);
				bodyClass = arrayUnique(bodyClass);
				instance.config.bodyClass = bodyClass.join(' ');

				if(opts.loadXeComponent) {
					var extraPlugins = e.editor.config.extraPlugins.split(',');

					extraPlugins.push('xe_component');
					extraPlugins = arrayUnique(extraPlugins);
					instance.config.extraPlugins = extraPlugins.join(',');
				}

				if(!opts.enableToolbar) instance.config.toolbar = [];
			});

			instance.on('instanceReady', function(e) {
				$containerEl.css("min-height", 0);
				if(window.editor_resize_iframe && window.editor_copy_input)
				{
					e.editor.setData(editor_copy_input.val());
					e.editor.on("resize", function(e){
						var height = e.data.outerHeight;
						editor_resize_iframe.height(height);
					});
					e.editor.on("change", function() {
						var content = e.editor.getData();
						editor_copy_input.val(content);
					});
					editor_resize_iframe.height($(".cke_chrome").parent().height());
				}
			});

			$containerEl.data('cke_instance', instance);

			window.editorRelKeys[data.editorSequence] = {};
			window.editorRelKeys[data.editorSequence].primary = primary_input[0];
			window.editorRelKeys[data.editorSequence].content = content_input[0];
			window.editorRelKeys[data.editorSequence].func = function(seq) {
				return self.getContent.call(self, seq);
			};
			window.editorRelKeys[data.editorSequence].pasteHTML = function(text){
				instance.insertHtml(text, 'html');
			};

			// 자동저장 필드가 있다면 자동 저장 기능 활성화
			if (typeof(fo_obj._saved_doc_title) !== 'undefined') {
				editorEnableAutoSave(fo_obj, editor_sequence);
			}
		},
		getContent : function(seq) {
			var self = this;
			var content = _getCkeInstance(seq).getData();
			self.cast('GET_CONTENT', [content]);

			return content;
		},
		getInstance : function(name) {
			return CKEDITOR.instances[name];
		},
		API_EDITOR_CREATED : function(){
		},
	});

	// Shortcut function in jQuery
	$.fn.XeCkEditor = function(opts) {
		var u = new XeCkEditor(this.eq(0), opts);

		if(u) {
			xe.registerApp(u);
			u.editorInit(this.eq(0), opts);
		}

		return u;
	};

	// Shortcut function in XE
	window.xe.XeCkEditor = function() {
		var u = new XeCkEditor();

		return u;
	};

})(jQuery);
