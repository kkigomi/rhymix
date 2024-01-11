@load('^common/js/plugins/filebox/filebox.js')

<section class="x_modal" id="modalFilebox" hidden>
	<div class="x_modal-header">
		<h1>File Box</h1>
	</div>

	<div class="x_modal-body">
		<h2>@lang('upload_file')</h2>

		<form id="new_filebox_upload" action="./" class="x_form-horizontal" method="post" enctype="multipart/form-data">
			<input type="hidden" name="module" value="module" />
			<input type="hidden" name="act" value="procModuleFileBoxAdd" />
			<input type="hidden" name="filter" value="{{ $filter }}" />
			<input type="hidden" name="input" value="{{ $input }}" />
			<input type="hidden" name="ajax" value="true" />

			<div class="x_control-group __attribute" data-count="1">
				<label for="attribute_name1" class="x_control-label __attribute_name_label">@lang('attribute_name')</label>
				<div class="x_controls">
					<input type="text" name="attribute_name[]" id="attribute_name1" class="__attribute_name" />
					<label for="attribute_value1" class="x_inline __attribute_value_label">@lang('attribute_value')
						<input type="text" name="attribute_value[]" id="attribute_value1" class="__attribute_value" />
					</label>
					<span class="x_btn-group">
						<button type="button" class="x_btn __addBtn" onclick="addRow('fileUp');">@lang('cmd_add')</button>
						<button type="button" class="x_btn __deleteBtn" onclick="clearRow(this);">@lang('cmd_delete')</button>
					</span>
				</div>
			</div>
			<div class="x_control-group">
				<label for="file" class="x_control-label">@lang('file')</label>
				<div class="x_controls">
					<input type="file" name="addfile" id="file" />
				</div>
			</div>
			<div class="btnArea">
				<button type="submit" class="x_btn x_btn-primary">@lang('cmd_save')</button>
			</div>
		</form>

		<h2>@lang('cmd_list')</h2>
		<div class="filebox_list"></div>

		<style scoped>
			.filebox_item {
				max-height: 80px;
				max-width: 200px
			}
		</style>
	</div>

	<div class="x_modal-footer">
		<button type="button" class="x_btn x_pull-left" data-hide="#modalFileBox">@lang('cmd_close')</button>
	</div>
</section>

<script>
	xe.lang.cmd_delete = '@lang('cmd_delete')';
</script>
