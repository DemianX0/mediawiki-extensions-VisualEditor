<?php

class VisualEditorHooks {
	/**
	 * Adds VisualEditor JS to the output if in the correct namespace
	 *
	 * @param $output OutputPage
	 * @param $skin Skin
	 */
	public static function onPageDisplay( &$output, &$skin ) {
		if ( self::loadVisualEditor( $output, $skin ) ) {
			$output->addModules( array( 'ext.visualEditor.core' ) );
		}
		return true;
	}

	/**
	 * Determines whether or not we should construct the loader.
	 *
	 * @param $output OutputPage
	 * @param $skin Skin
	 */
	public static function loadVisualEditor( &$output, &$skin ) {
		global $wgTitle;
		// Vector skin supported for now.
		if ( $skin->getSkinName() !== 'vector' ) {
			return false;
		}
		// Check Namespace
		if ($wgTitle->getNamespace() !== NS_VISUALEDITOR) {
			return false;
		}
		//TODO: user permissions...
		return true;
	}

}
