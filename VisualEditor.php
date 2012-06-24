<?php
/**
 * VisualEditor extension
 * 
 * @file
 * @ingroup Extensions
 * 
 * @author Trevor Parscal <trevor@wikimedia.org>
 * @author Inez Korczyński <inez@wikia-inc.com>
 * @author Roan Kattouw <roan.kattouw@gmail.com>
 * @author Neil Kandalgaonkar <neilk@wikimedia.org>
 * @author Gabriel Wicke <gwicke@wikimedia.org>
 * @author Brion Vibber <brion@wikimedia.org>
 * @license GPL v2 or later
 * @version 0.1.0
 */

/* Configuration */

// URL to the parsoid instance
$wgVisualEditorParsoidURL = 'http://parsoid.wmflabs.org/';

/* Setup */

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'VisualEditor',
	'author' => array(
		'Trevor Parscal',
		'Inez Korczyński',
		'Roan Kattouw',
		'Neil Kandalgaonkar',
		'Gabriel Wicke',
		'Brion Vibber',
	),
	'version' => '0.1.0',
	'url' => 'https://www.mediawiki.org/wiki/Extension:VisualEditor',
	'descriptionmsg' => 'visualeditor-desc',
);
$dir = dirname( __FILE__ ) . '/';
$wgExtensionMessagesFiles['VisualEditor'] = $dir . 'VisualEditor.i18n.php';
$wgExtensionMessagesFiles['VisualEditorAliases'] = $dir . 'VisualEditor.alias.php';
$wgAutoloadClasses['SpecialVisualEditorSandbox'] = $dir . 'SpecialVisualEditorSandbox.php';
$wgSpecialPages['VisualEditorSandbox'] = 'SpecialVisualEditorSandbox';
$wgSpecialPageGroups['VisualEditorSandbox'] = 'other';

$wgVisualEditorResourceTemplate = array(
	'localBasePath' => dirname( __FILE__ ) . '/modules',
	'remoteExtPath' => 'VisualEditor/modules',
	'group' => 'ext.visualEditor',
);

$wgResourceModules += array(
	'rangy' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			'rangy/rangy-core.js',
			'rangy/rangy-position.js',
		),
	),
	'ext.visualEditor.special.sandbox' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			'sandbox/special.js',
		),
		'messages' => array(
			'visualeditor-feedback-prompt',
			'visualeditor-feedback-dialog-title',
			'visualeditor-sandbox-title',
		),
		'dependencies' => array( 
			'ext.visualEditor.sandbox',
			'mediawiki.feedback',
			'mediawiki.Uri',
		)
	),
	'ext.visualEditor.sandbox' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			'sandbox/sandbox.js',
		),
		'messages' => array(
			'visualeditorsandbox',
		),
		'styles' => 'sandbox/sandbox.css',
		'dependencies' => array(
			'ext.visualEditor.core',
		),
	),
	'ext.visualEditor.editPageInit' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			've/init/targets/ve.init.ViewPageTarget.js',
		),
		'styles' => array(
			've/init/styles/ve.init.ViewPageTarget.css',
			've/init/styles/ve.init.ViewPageTarget-hd.css' => array(
				'media' => 'screen and (min-width: 982px)'
			),
		),
		'dependencies' => array(
			'ext.visualEditor.init',
			'mediawiki.util',
			'mediawiki.Uri'
		),
		'messages' => array(
			'minoredit',
			'savearticle',
			'watchthis',
			'summary',
			'tooltip-save',
			'copyrightwarning',
			'copyrightpage',
			'edit',
			'create',
			'accesskey-ca-edit',
			'tooltip-ca-edit',
			'viewsource',
			'visualeditor-ca-editsource',
			'visualeditor-loadwarning',
		),
	),
	'ext.visualEditor.init' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			've/init/ve.init.js',
			've/init/ve.init.Target.js',
		),
		'dependencies' => array(
			'ext.visualEditor.base'
		),
	),
	'ext.visualEditor.base' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			// ve
			'jquery/jquery.json.js',
			've/ve.js',
			've/ve.EventEmitter.js',
		),
		'debugScripts' => array(
			've/ve.debug.js',
		),
	),
	'ext.visualEditor.specialMessages' => $wgVisualEditorResourceTemplate + array(
		'class' => 'VisualEditorMessagesModule'
	),
	'ext.visualEditor.core' => $wgVisualEditorResourceTemplate + array(
		'scripts' => array(
			// ve
			've/ve.Factory.js',
			've/ve.Position.js',
			've/ve.Range.js',
			've/ve.Node.js',
			've/ve.BranchNode.js',
			've/ve.LeafNode.js',
			've/ve.Surface.js',
			've/ve.Document.js',

			// dm
			've/dm/ve.dm.js',
			've/dm/ve.dm.NodeFactory.js',
			've/dm/ve.dm.AnnotationFactory.js',
			've/dm/ve.dm.Node.js',
			've/dm/ve.dm.BranchNode.js',
			've/dm/ve.dm.LeafNode.js',
			've/dm/ve.dm.Annotation.js',
			've/dm/ve.dm.TransactionProcessor.js',
			've/dm/ve.dm.Transaction.js',
			've/dm/ve.dm.Surface.js',
			've/dm/ve.dm.Document.js',
			've/dm/ve.dm.DocumentSynchronizer.js',
			've/dm/ve.dm.Converter.js',

			've/dm/nodes/ve.dm.AlienInlineNode.js',
			've/dm/nodes/ve.dm.AlienBlockNode.js',
			've/dm/nodes/ve.dm.DefinitionListItemNode.js',
			've/dm/nodes/ve.dm.DefinitionListNode.js',
			've/dm/nodes/ve.dm.DocumentNode.js',
			've/dm/nodes/ve.dm.HeadingNode.js',
			've/dm/nodes/ve.dm.ImageNode.js',
			've/dm/nodes/ve.dm.ListItemNode.js',
			've/dm/nodes/ve.dm.ListNode.js',
			've/dm/nodes/ve.dm.ParagraphNode.js',
			've/dm/nodes/ve.dm.PreformattedNode.js',
			've/dm/nodes/ve.dm.TableCellNode.js',
			've/dm/nodes/ve.dm.TableNode.js',
			've/dm/nodes/ve.dm.TableRowNode.js',
			've/dm/nodes/ve.dm.TableSectionNode.js',
			've/dm/nodes/ve.dm.TextNode.js',

			've/dm/annotations/ve.dm.LinkAnnotation.js',
			've/dm/annotations/ve.dm.TextStyleAnnotation.js',

			// ce
			've/ce/ve.ce.js',
			've/ce/ve.ce.NodeFactory.js',
			've/ce/ve.ce.Document.js',
			've/ce/ve.ce.Node.js',
			've/ce/ve.ce.BranchNode.js',
			've/ce/ve.ce.LeafNode.js',
			've/ce/ve.ce.Surface.js',

			've/ce/nodes/ve.ce.AlienInlineNode.js',
			've/ce/nodes/ve.ce.AlienBlockNode.js',
			've/ce/nodes/ve.ce.DefinitionListItemNode.js',
			've/ce/nodes/ve.ce.DefinitionListNode.js',
			've/ce/nodes/ve.ce.DocumentNode.js',
			've/ce/nodes/ve.ce.HeadingNode.js',
			've/ce/nodes/ve.ce.ImageNode.js',
			've/ce/nodes/ve.ce.ListItemNode.js',
			've/ce/nodes/ve.ce.ListNode.js',
			've/ce/nodes/ve.ce.ParagraphNode.js',
			've/ce/nodes/ve.ce.PreformattedNode.js',
			've/ce/nodes/ve.ce.TableCellNode.js',
			've/ce/nodes/ve.ce.TableNode.js',
			've/ce/nodes/ve.ce.TableRowNode.js',
			've/ce/nodes/ve.ce.TableSectionNode.js',
			've/ce/nodes/ve.ce.TextNode.js',

			// ui
			've/ui/ve.ui.js',
			've/ui/ve.ui.Inspector.js',
			've/ui/ve.ui.Tool.js',
			've/ui/ve.ui.Toolbar.js',
			've/ui/ve.ui.Context.js',
			've/ui/ve.ui.Menu.js',

			've/ui/inspectors/ve.ui.LinkInspector.js',

			've/ui/tools/ve.ui.ButtonTool.js',
			've/ui/tools/ve.ui.AnnotationButtonTool.js',
			've/ui/tools/ve.ui.ClearButtonTool.js',
			've/ui/tools/ve.ui.HistoryButtonTool.js',
			've/ui/tools/ve.ui.ListButtonTool.js',
			've/ui/tools/ve.ui.IndentationButtonTool.js',
			've/ui/tools/ve.ui.DropdownTool.js',
			've/ui/tools/ve.ui.FormatDropdownTool.js'
		),
		'styles' => array(
			// ce
			've/ce/styles/ve.ce.Document.css',
			've/ce/styles/ve.ce.Node.css',
			've/ce/styles/ve.ce.Surface.css',
			// ui
			've/ui/styles/ve.ui.Context.css',
			've/ui/styles/ve.ui.Inspector.css',
			've/ui/styles/ve.ui.Menu.css',
			've/ui/styles/ve.ui.Surface.css',
			've/ui/styles/ve.ui.Toolbar.css',
		),
		'dependencies' => array(
			'jquery',
			'rangy',
			'ext.visualEditor.base'
		),
		'messages' => array(
			'visualeditor-tooltip-wikitext',
			'visualeditor-tooltip-json',
			'visualeditor-tooltip-html',
			'visualeditor-tooltip-render',
			'visualeditor-tooltip-history',
			'visualeditor-tooltip-help',
			'visualeditor',
			'visualeditor-linkinspector-title',
			'visualeditor-linkinspector-tooltip',
			'visualeditor-linkinspector-label-pagetitle',
			'visualeditor-formatdropdown-tooltip',
			'visualeditor-formatdropdown-format-paragraph',
			'visualeditor-formatdropdown-format-heading1',
			'visualeditor-formatdropdown-format-heading2',
			'visualeditor-formatdropdown-format-heading3',
			'visualeditor-formatdropdown-format-heading4',
			'visualeditor-formatdropdown-format-heading5',
			'visualeditor-formatdropdown-format-heading6',
			'visualeditor-formatdropdown-format-preformatted',
			'visualeditor-annotationbutton-bold-tooltip',
			'visualeditor-annotationbutton-italic-tooltip',
			'visualeditor-annotationbutton-link-tooltip',
			'visualeditor-indentationbutton-indent-tooltip',
			'visualeditor-indentationbutton-outdent-tooltip',
			'visualeditor-listbutton-number-tooltip',
			'visualeditor-listbutton-bullet-tooltip',
			'visualeditor-clearbutton-tooltip',
			'visualeditor-historybutton-undo-tooltip',
			'visualeditor-historybutton-redo-tooltip',
			'visualeditor-viewpage-savewarning',
			'visualeditor-saveerror',
		),
	)
);

/*
 * VisualEditor Namespace
 * Using 2500 and 2501 as per registration on mediawiki.org
 *
 * @see http://www.mediawiki.org/wiki/Extension_default_namespaces
*/
define( 'NS_VISUALEDITOR', 2500 );
define( 'NS_VISUALEDITOR_TALK', 2501 );
$wgExtraNamespaces[NS_VISUALEDITOR] = 'VisualEditor';
$wgExtraNamespaces[NS_VISUALEDITOR_TALK] = 'VisualEditor_talk';
$wgContentNamespaces[] = NS_VISUALEDITOR;
$wgContentNamespaces[] = NS_VISUALEDITOR_TALK;

// VE Namespace protection
$wgNamespaceProtection[NS_VISUALEDITOR] = array( 've-edit' );
$wgGroupPermissions['sysop']['ve-edit'] = true;

// Parsoid Wrapper API
$wgAutoloadClasses['ApiVisualEditor'] = $dir . 'ApiVisualEditor.php';
$wgAPIModules['ve-parsoid'] = 'ApiVisualEditor';

// Integration Hooks
$wgAutoloadClasses['VisualEditorHooks'] = $dir . 'VisualEditor.hooks.php';
$wgHooks['BeforePageDisplay'][] = 'VisualEditorHooks::onBeforePageDisplay';
$wgHooks['MakeGlobalVariablesScript'][] = 'VisualEditorHooks::onMakeGlobalVariablesScript';

$wgAutoloadClasses['VisualEditorMessagesModule'] = $dir . 'VisualEditorMessagesModule.php';
