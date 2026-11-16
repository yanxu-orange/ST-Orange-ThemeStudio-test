import {applySpringFonts} from './spring-fonts.mjs';
const template = {
  "timeFont": "Georgia, serif",
  "textAlign": "start",
  "textInset": 0,
  "textTop": 0,
  "cardPadding": 14,
  "cardShadow": false,
  "bodyFontLink": null,
  "cardGutter": 0,
  "messageGap": 28,
  "cardFullWidth": true,
  "bodyWeight": 350,
  "bodyParagraphGap": 16,
  "bodyPaddingLeft": 13,
  "bodyPaddingRight": 0,
  "bodyIndent": true,
  "bodyLeftBorderWidth": 2,
  "bodyLeftBorderColor": "#f49fb3",
  "cardBorderMode": "custom",
  "cardBorderColor": "#ead5db",
  "cardBorderWidth": 1,
  "cardBorderStyle": "solid",
  "cardBorderTop": true,
  "cardBorderRight": false,
  "cardBorderBottom": true,
  "cardBorderLeft": false,
  "textItems": {
    "name": {
      "x": 25,
      "y": 40,
      "weight": "auto",
      "z": 3,
      "fontLink": null,
      "width": "auto"
    },
    "time": {
      "x": 25,
      "y": 72,
      "weight": "auto",
      "z": 3,
      "fontLink": null,
      "width": "auto"
    }
  },
  "version": 10,
  "template": "spring",
  "avatarDesign": "separate",
  "canvasBackground": "tavern",
  "background": "#eaf0f6",
  "surface": "#ffffff",
  "text": "#465244",
  "accent": "#e48fa6",
  "radius": 0,
  "font": "serif",
  "fontSize": 17,
  "lineHeight": 1.9,
  "layout": "top",
  "avatarSize": 56,
  "headerHeight": 350,
  "avatarRadius": 16,
  "nameColor": "#465244",
  "nameSize": 21,
  "nameFont": "serif",
  "timeColor": "#788572",
  "timeSize": 11,
  "decoration": "none",
  "decorationWidth": 90,
  "decorationX": 8,
  "decorationY": 8,
  "decorationOpacity": 0.8,
  "glass": 0,
  "image": "",
  "surfaceOpacity": 1,
  "cardWidth": 760,
  "metadata": {
    "design": "separate",
    "unified": {
      "name": null,
      "time": null
    },
    "roles": {
      "ai": {
        "name": {
          "region": "header",
          "flow": "overlay",
          "anchor": "left",
          "x": 46,
          "y": 154,
          "width": 52,
          "style": {
            "font": "serif",
            "fontLink": null,
            "size": 21,
            "weight": 400,
            "color": "#465244"
          }
        },
        "time": {
          "region": "header",
          "flow": "overlay",
          "anchor": "left",
          "x": 46,
          "y": 190,
          "width": 52,
          "style": {
            "font": "Georgia, serif",
            "fontLink": null,
            "size": 11,
            "weight": 400,
            "color": "#788572"
          }
        }
      },
      "user": {
        "name": {
          "region": "header",
          "flow": "overlay",
          "anchor": "left",
          "x": 62,
          "y": 186,
          "width": 36,
          "style": {
            "font": "serif",
            "fontLink": null,
            "size": 28,
            "weight": 400,
            "color": "#465244"
          }
        },
        "time": {
          "region": "header",
          "flow": "overlay",
          "anchor": "left",
          "x": 62,
          "y": 222,
          "width": 36,
          "style": {
            "font": "Georgia, serif",
            "fontLink": null,
            "size": 11,
            "weight": 400,
            "color": "#788572"
          }
        }
      }
    }
  },
  "pageHeaders": {
    "home": {
      "enabled": false,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 160,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "native",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#354b42",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [],
        "texts": [],
        "order": []
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "presets": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "presets-art",
            "name": "预设头图",
            "kind": "asset",
            "image": "",
            "width": 114,
            "x": 3,
            "y": 3,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-presets-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "presets-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "presets-title",
            "name": "中文标题",
            "content": "预设",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "presets-subtitle",
            "name": "英文副标题",
            "content": "PRESETS",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:presets-art",
          "image:presets-line",
          "text:presets-title",
          "text:presets-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "connection": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "connection-art",
            "name": "API头图",
            "kind": "asset",
            "image": "",
            "width": 141,
            "x": 4,
            "y": 3,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-connection-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "connection-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "connection-title",
            "name": "中文标题",
            "content": "API",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "connection-subtitle",
            "name": "英文副标题",
            "content": "CONNECTION",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:connection-art",
          "image:connection-line",
          "text:connection-title",
          "text:connection-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "worldbook": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "worldbook-art",
            "name": "世界书头图",
            "kind": "asset",
            "image": "",
            "width": 120,
            "x": 2,
            "y": 3,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-worldbook-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "worldbook-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "worldbook-title",
            "name": "中文标题",
            "content": "世界书",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "worldbook-subtitle",
            "name": "英文副标题",
            "content": "WORLD BOOK",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:worldbook-art",
          "image:worldbook-line",
          "text:worldbook-title",
          "text:worldbook-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "settings": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "settings-art",
            "name": "设置头图",
            "kind": "asset",
            "image": "",
            "width": 146,
            "x": -17,
            "y": -11,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-settings-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "settings-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "settings-title",
            "name": "中文标题",
            "content": "设置",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "settings-subtitle",
            "name": "英文副标题",
            "content": "SETTINGS",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:settings-art",
          "image:settings-line",
          "text:settings-title",
          "text:settings-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "backgrounds": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "backgrounds-art",
            "name": "背景头图",
            "kind": "asset",
            "image": "",
            "width": 120,
            "x": 4,
            "y": -5,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-backgrounds-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "backgrounds-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "backgrounds-title",
            "name": "中文标题",
            "content": "背景",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "backgrounds-subtitle",
            "name": "英文副标题",
            "content": "BACKGROUNDS",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:backgrounds-art",
          "image:backgrounds-line",
          "text:backgrounds-title",
          "text:backgrounds-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "extensions": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "extensions-art",
            "name": "扩展头图",
            "kind": "asset",
            "image": "",
            "width": 125,
            "x": -5,
            "y": -3,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-extensions-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "extensions-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "extensions-title",
            "name": "中文标题",
            "content": "扩展",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "extensions-subtitle",
            "name": "英文副标题",
            "content": "EXTENSIONS",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:extensions-art",
          "image:extensions-line",
          "text:extensions-title",
          "text:extensions-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "personas": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "personas-art",
            "name": "用户人设头图",
            "kind": "asset",
            "image": "",
            "width": 113,
            "x": 1,
            "y": 5,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-personas-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "personas-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "personas-title",
            "name": "中文标题",
            "content": "用户人设",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "personas-subtitle",
            "name": "英文副标题",
            "content": "PERSONA",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:personas-art",
          "image:personas-line",
          "text:personas-title",
          "text:personas-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "characters": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "characters-art",
            "name": "角色管理头图",
            "kind": "asset",
            "image": "",
            "width": 124,
            "x": -4,
            "y": 0,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-characters-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "characters-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "characters-title",
            "name": "中文标题",
            "content": "角色管理",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "characters-subtitle",
            "name": "英文副标题",
            "content": "CHARACTERS",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:characters-art",
          "image:characters-line",
          "text:characters-title",
          "text:characters-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    },
    "formatting": {
      "enabled": true,
      "asset": "",
      "image": "",
      "sizing": "fixed",
      "height": 68,
      "fit": "cover",
      "x": 50,
      "y": 50,
      "topGap": 0,
      "sideGap": 0,
      "layout": "standard",
      "titleSubtitle": null,
      "titleDecoration": null,
      "title": "",
      "titleSize": 22,
      "titleColor": "#465244",
      "titleAlign": "left",
      "titleWeight": 400,
      "placement": "banner",
      "scene": {
        "images": [
          {
            "id": "formatting-art",
            "name": "格式头图",
            "kind": "asset",
            "image": "",
            "width": 126,
            "x": -2,
            "y": -9,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "right",
            "asset": "spring-pageheaders-formatting-scene-images-0",
            "widthUnit": "px",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0
          },
          {
            "id": "formatting-line",
            "name": "页头粉细线",
            "kind": "shape",
            "image": "",
            "width": 100,
            "x": 0,
            "y": 66,
            "opacity": 1,
            "rotation": 0,
            "visible": true,
            "side": "left",
            "asset": "",
            "widthUnit": "percent",
            "offsetUnit": "px",
            "vertical": "top",
            "heightPercent": 0,
            "shape": "rectangle",
            "height": 1,
            "heightUnit": "px",
            "cornerRadius": 0,
            "fillMode": "solid",
            "color": "#e48fa6",
            "color2": "#e9ca81",
            "gradientAngle": 90
          }
        ],
        "texts": [
          {
            "id": "formatting-title",
            "name": "中文标题",
            "content": "格式",
            "font": "serif",
            "size": 25,
            "color": "#465244",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 8,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          },
          {
            "id": "formatting-subtitle",
            "name": "英文副标题",
            "content": "FORMATTING",
            "font": "Georgia, serif",
            "size": 10,
            "color": "#788572",
            "visible": true,
            "width": 60,
            "x": 10,
            "y": 47,
            "weight": "auto",
            "fontLink": null,
            "align": "left"
          }
        ],
        "order": [
          "image:formatting-art",
          "image:formatting-line",
          "text:formatting-title",
          "text:formatting-subtitle"
        ]
      },
      "native": {
        "hideLogo": false,
        "version": null,
        "settings": null,
        "show": null,
        "hide": null
      }
    }
  },
  "pageStyle": {
    "settings": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "section": null,
      "art": {
        "page": null,
        "section": null
      }
    },
    "worldbook": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "entry": null,
      "entryHeading": null,
      "art": {
        "page": null,
        "entry": null
      }
    },
    "presets": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "entry": null,
      "promptList": true,
      "sliderTip": "native",
      "art": {
        "page": null
      }
    },
    "connection": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    },
    "backgrounds": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    },
    "extensions": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    },
    "personas": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    },
    "characters": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    },
    "formatting": {
      "text": null,
      "panel": null,
      "heading": null,
      "button": null,
      "field": null,
      "art": {
        "page": null
      }
    }
  },
  "commonStyle": {
    "text": {
      "font": "serif",
      "size": 15,
      "color": "#465244",
      "muted": "#788572",
      "accent": "#e48fa6",
      "fontLink": null
    },
    "panel": {
      "background": "#ffffff",
      "opacity": 1,
      "border": "#ead5db",
      "width": 1,
      "radius": 3
    },
    "heading": {
      "color": "#788572",
      "background": "#fff7f9",
      "size": 16,
      "weight": 400,
      "radius": 0
    },
    "button": {
      "color": "#465244",
      "background": "#ffffff",
      "border": "#cbd2c7",
      "radius": 3,
      "hover": "#fbeef2"
    },
    "field": {
      "color": "#465244",
      "background": "#ffffff",
      "border": "#cbd2c7",
      "radius": 3,
      "focus": "#e48fa6"
    }
  },
  "hideScrollbars": true,
  "captions": [
    {
      "id": "spring",
      "name": "SPRING",
      "content": "SPRING",
      "font": "Georgia, serif",
      "size": 30,
      "color": "#e48fa6",
      "visible": true,
      "scope": "ai",
      "width": 45,
      "scaleX": 0.646,
      "x": 46,
      "y": 72,
      "weight": 400,
      "z": 3,
      "fontLink": null
    },
    {
      "id": "letter",
      "name": "LETTER",
      "content": "LETTER",
      "font": "Georgia, serif",
      "size": 30,
      "color": "#e48fa6",
      "visible": true,
      "scope": "ai",
      "width": 45,
      "scaleX": 0.74,
      "x": 46,
      "y": 105,
      "weight": 400,
      "z": 3,
      "fontLink": null
    },
    {
      "id": "to-you",
      "name": "TO\nYOU",
      "content": "TO\nYOU",
      "font": "Georgia, serif",
      "size": 63,
      "color": "#e48fa6",
      "visible": true,
      "scope": "user",
      "width": "auto",
      "scaleX": 0.94,
      "lineHeight": 1,
      "x": 62,
      "y": 59,
      "weight": 400,
      "z": 3,
      "fontLink": null
    },
    {
      "id": "flower-whisper",
      "name": "花间絮语",
      "content": "花间絮语",
      "font": "serif",
      "size": 13,
      "color": "#e48fa6",
      "visible": true,
      "scope": "ai",
      "width": 45,
      "x": 46,
      "y": 215,
      "weight": 400,
      "z": 3,
      "fontLink": null
    }
  ],
  "layers": [
    {
      "id": "spring-ai-flower",
      "name": "AI右侧长花枝",
      "kind": "asset",
      "image": "",
      "width": 148,
      "x": 0,
      "y": 36,
      "opacity": 1,
      "rotation": 0,
      "z": 1,
      "visible": true,
      "anchor": "header",
      "side": "right",
      "scope": "ai",
      "asset": "shared-spring-flower-stem",
      "widthUnit": "px",
      "offsetUnit": "px",
      "vertical": "top",
      "heightPercent": 0
    },
    {
      "id": "spring-user-flower",
      "name": "用户左下粉花",
      "kind": "asset",
      "image": "",
      "width": 109,
      "x": -16,
      "y": 107,
      "opacity": 1,
      "rotation": 0,
      "z": 5,
      "visible": true,
      "anchor": "header",
      "side": "left",
      "scope": "user",
      "asset": "shared-spring-pink-flowers",
      "widthUnit": "px",
      "offsetUnit": "px",
      "vertical": "top",
      "heightPercent": 0
    },
    {
      "id": "spring-input-flower",
      "name": "发送按钮旁小花",
      "kind": "asset",
      "image": "",
      "width": 38,
      "x": 44,
      "y": 4,
      "opacity": 1,
      "rotation": 24,
      "z": 2,
      "visible": true,
      "anchor": "input",
      "side": "right",
      "scope": "both",
      "asset": "spring-layers-2",
      "widthUnit": "px",
      "offsetUnit": "px",
      "vertical": "bottom",
      "heightPercent": 0
    },
    {
      "id": "spring-footer-leaf",
      "name": "尾部叶片",
      "kind": "asset",
      "image": "",
      "width": 15,
      "x": 0,
      "y": 0,
      "opacity": 1,
      "rotation": 0,
      "z": 2,
      "visible": true,
      "anchor": "footer",
      "side": "right",
      "scope": "both",
      "asset": "spring-layers-3",
      "widthUnit": "px",
      "offsetUnit": "px",
      "vertical": "top",
      "heightPercent": 0
    },
    {
      "id": "spring-footer-line",
      "name": "尾部粉细线",
      "kind": "shape",
      "image": "",
      "width": 95,
      "x": 0,
      "y": 6,
      "opacity": 1,
      "rotation": 0,
      "z": 2,
      "visible": true,
      "anchor": "footer",
      "side": "left",
      "scope": "both",
      "asset": "",
      "widthUnit": "percent",
      "offsetUnit": "px",
      "vertical": "top",
      "heightPercent": 0,
      "shape": "rectangle",
      "height": 1,
      "heightUnit": "px",
      "cornerRadius": 0,
      "fillMode": "solid",
      "color": "#ead5db",
      "color2": "#e9ca81",
      "gradientAngle": 90
    }
  ],
  "photos": {
    "ai": {
      "enabled": true,
      "size": 42,
      "widthUnit": "percent",
      "height": "auto",
      "radius": 0,
      "ratio": "0.8",
      "frameWidth": 0,
      "frameColor": "#fffdf4",
      "shadow": false,
      "x": 0,
      "y": -46,
      "rotation": 0,
      "image": "",
      "asset": ""
    },
    "user": {
      "enabled": true,
      "size": 48,
      "widthUnit": "percent",
      "height": "auto",
      "radius": 0,
      "ratio": "0.8",
      "frameWidth": 0,
      "frameColor": "#fffdf4",
      "shadow": false,
      "x": 17,
      "y": -46,
      "rotation": 0,
      "image": "",
      "asset": ""
    }
  },
  "reasoningStyle": {
    "entry": {
      "fontSource": "custom",
      "font": "serif",
      "size": 17,
      "weight": 300,
      "color": "#788572",
      "fontLink": null,
      "content": "东风里，掠过我脸边，星呀星的细雨，是春天的绒毛呢。",
      "showArrow": false,
      "labelPosition": {
        "x": 0,
        "y": 0
      },
      "background": {
        "mode": "none",
        "color": "#eeeeee",
        "opacity": 1,
        "source": null,
        "fit": "cover",
        "x": 50,
        "y": 50
      },
      "geometry": {
        "width": "auto",
        "minHeight": 0,
        "radius": 0,
        "paddingX": 0,
        "paddingY": 0
      },
      "secondary": {
        "content": "——朱自清《细雨》",
        "size": 12,
        "color": "#788572",
        "align": "right"
      }
    },
    "body": {
      "fontSource": "custom",
      "font": "serif",
      "size": 15,
      "weight": "auto",
      "color": "#788572",
      "fontLink": null,
      "container": {
        "background": "none",
        "color": "#ffffff",
        "radius": 0,
        "borderWidth": 0,
        "borderColor": "#cccccc",
        "borderStyle": "solid",
        "paddingX": 12,
        "paddingY": 12
      }
    }
  },
  "footerCaptions": [],
  "nativeStyle": {
    "actions": {
      "size": 12,
      "color": "#788572",
      "edit": {
        "position": "footer",
        "x": 60,
        "y": 20,
        "anchor": "top",
        "imageSize": 23,
        "mode": "text",
        "text": "编辑",
        "source": null
      },
      "more": {
        "position": "footer",
        "x": 85,
        "y": 20,
        "anchor": "top",
        "mode": "text",
        "text": "更多",
        "source": null,
        "imageSize": 23
      }
    },
    "stats": {
      "size": 11,
      "color": "#788572",
      "floor": {
        "prefix": "第 ",
        "suffix": " 封",
        "position": "footer",
        "x": 0,
        "y": 24
      },
      "time": {
        "position": "footer",
        "x": 46,
        "y": 24
      },
      "tokens": {
        "position": "footer",
        "x": 23,
        "y": 24
      }
    },
    "swipe": {
      "size": 12,
      "color": "#788572",
      "gap": 6,
      "x": 0,
      "y": 58,
      "position": "footer",
      "layout": "ends",
      "left": {
        "mode": "text",
        "text": "上一封"
      },
      "right": {
        "mode": "text",
        "text": "下一封"
      },
      "hideHistory": true,
      "hideLatest": false
    }
  },
  "regionOrder": {
    "header": [
      "avatar",
      "name",
      "time",
      "caption:spring",
      "caption:letter",
      "caption:to-you",
      "caption:flower-whisper",
      "image:spring-ai-flower",
      "image:spring-user-flower"
    ],
    "overall": [],
    "reasoning": [],
    "footer": [
      "image:spring-footer-leaf",
      "image:spring-footer-line"
    ],
    "input": [
      "image:spring-input-flower"
    ]
  },
  "chromeStyle": {
    "topbar": {
      "enabled": true,
      "color": "#ffffff",
      "alpha": 1,
      "blur": 0,
      "radius": 0,
      "borderEnabled": true,
      "borderColor": "#ead5db",
      "borderWidth": 1,
      "iconSize": 24,
      "slot": 40,
      "gap": 0,
      "padY": 0,
      "icons": {
        "ai-config-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-ai-config-button",
          "image": ""
        },
        "sys-settings-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-sys-settings-button",
          "image": ""
        },
        "advanced-formatting-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-advanced-formatting-button",
          "image": ""
        },
        "WI-SP-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-wi-sp-button",
          "image": ""
        },
        "user-settings-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-user-settings-button",
          "image": ""
        },
        "backgrounds-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-backgrounds-button",
          "image": ""
        },
        "extensions-settings-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-extensions-settings-button",
          "image": ""
        },
        "persona-management-button": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-persona-management-button",
          "image": ""
        },
        "rightNavHolder": {
          "mode": "image",
          "asset": "spring-chromestyle-topbar-icons-rightnavholder",
          "image": ""
        }
      }
    },
    "input": {
      "enabled": true,
      "color": "#ffffff",
      "alpha": 1,
      "blur": 0,
      "radius": 7,
      "borderEnabled": true,
      "borderColor": "#e48fa6",
      "borderWidth": 1,
      "textSurface": {
        "enabled": false,
        "color": "#fffdf8",
        "alpha": 1,
        "radius": 0
      },
      "emptyText": {
        "enabled": true,
        "idle": "A little letter for you",
        "generating": "A little letter for you",
        "color": "#858c80",
        "size": 14
      },
      "width": 100,
      "leftGap": 0,
      "rightGap": 0,
      "padX": 9,
      "padY": 6,
      "layout": "stacked",
      "fontMode": "custom",
      "font": "serif",
      "fontLink": null,
      "size": 16,
      "weight": 400,
      "textColor": "#465244",
      "lineHeight": 1.5,
      "minHeight": 44,
      "maxHeight": 320,
      "iconSize": 24,
      "slot": 40,
      "gap": 0,
      "icons": {
        "options_button": {
          "mode": "image",
          "asset": "spring-chromestyle-input-icons-options_button",
          "image": ""
        },
        "extensionsMenuButton": {
          "mode": "image",
          "asset": "spring-chromestyle-input-icons-extensionsmenubutton",
          "image": ""
        },
        "send_but": {
          "mode": "image",
          "asset": "spring-chromestyle-input-icons-send_but",
          "image": ""
        },
        "mes_stop": {
          "mode": "image",
          "asset": "spring-chromestyle-input-icons-mes_stop",
          "image": ""
        }
      }
    }
  },
  "avatarFill": {
    "ai": {
      "enabled": false,
      "gradient": false,
      "x": 50,
      "y": 50,
      "opacity": 1,
      "start": 40,
      "color": "#ffffff"
    },
    "user": {
      "enabled": false,
      "gradient": false,
      "x": 50,
      "y": 50,
      "opacity": 1,
      "start": 40,
      "color": "#ffffff"
    }
  }
};
export function createSpringTemplate(baseUrl=import.meta.url) {
  const config=structuredClone(template);
  return /^https?:/.test(baseUrl) ? applySpringFonts(config,baseUrl) : config;
}
