<?php

namespace App\Support;

use DOMDocument;
use DOMNode;
use DOMText;

class TemplateContent
{
    private const ALLOWED_TAGS = [
        'b', 'blockquote', 'br', 'em', 'h2', 'h3', 'i', 'li', 'ol', 'p', 's', 'strong', 'table', 'tbody', 'td',
        'th', 'tr', 'u', 'ul',
    ];

    private const DROP_CONTENT_TAGS = ['iframe', 'object', 'script', 'style', 'svg'];

    public static function sanitize(string $content): string
    {
        if ($content === '') {
            return '';
        }

        if (strip_tags($content) === $content) {
            return self::fromPlainText($content);
        }

        $previousErrorSetting = libxml_use_internal_errors(true);

        try {
            $document = new DOMDocument('1.0', 'UTF-8');
            $document->loadHTML(
                '<?xml encoding="UTF-8"><!DOCTYPE html><html><body><div id="template-root">'.$content.'</div></body></html>',
                LIBXML_NONET,
            );

            $root = $document->getElementById('template-root');

            if ($root === null) {
                return '';
            }

            $html = '';

            foreach ($root->childNodes as $child) {
                $html .= self::sanitizeNode($child);
            }

            return $html;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorSetting);
        }
    }

    private static function fromPlainText(string $content): string
    {
        $paragraphs = preg_split('/(?:\r\n|\r|\n){2,}/', trim($content), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return implode('', array_map(
            fn (string $paragraph) => '<p>'.nl2br(e($paragraph), false).'</p>',
            $paragraphs,
        ));
    }

    private static function sanitizeNode(DOMNode $node): string
    {
        if ($node instanceof DOMText) {
            return htmlspecialchars($node->nodeValue ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }

        if ($node->nodeType !== XML_ELEMENT_NODE) {
            return '';
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, self::DROP_CONTENT_TAGS, true)) {
            return '';
        }

        $children = '';

        foreach ($node->childNodes as $child) {
            $children .= self::sanitizeNode($child);
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            return $children;
        }

        if ($tag === 'br') {
            return '<br>';
        }

        return '<'.$tag.'>'.$children.'</'.$tag.'>';
    }
}
