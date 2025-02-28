/* ================ SLATE ================ */
window.theme = window.theme || {};
window.slate = window.slate || {};

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on("shopify:section:load", this._onSectionLoad.bind(this))
    .on("shopify:section:unload", this._onSectionUnload.bind(this))
    .on("shopify:section:select", this._onSelect.bind(this))
    .on("shopify:section:deselect", this._onDeselect.bind(this))
    .on("shopify:block:select", this._onBlockSelect.bind(this))
    .on("shopify:block:deselect", this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function (container, constructor) {
    var $container = $(container);
    var id = $container.attr("data-section-id");
    var type = $container.attr("data-section-type");

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container,
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function (evt) {
    var container = $("[data-section-id]", evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function (evt) {
    this.instances = _.filter(this.instances, function (instance) {
      var isEventInstance = instance.id === evt.originalEvent.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function (evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function (instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function (evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function (instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function (evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function (instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function (evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function (instance) {
      return instance.id === evt.originalEvent.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function (type, constructor) {
    this.constructors[type] = constructor;

    $("[data-section-type=" + type + "]").each(
      function (index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  },
});

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function () {
  var moneyFormat = "$";

  function formatMoney(cents, format) {
    if (typeof cents === "string") {
      cents = cents.replace(".", "");
    }
    var value = "";
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ",";
      decimal = decimal || ".";

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split(".");
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        "$1" + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : "";

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, " ");
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney,
  };
})();

/**
 * Image Helper Functions
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function () {
  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === "string") {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element); // eslint-disable-line callback-return
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * +++ Useful
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    var match = src.match(
      /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[.@]/
    );

    if (match !== null) {
      return match[1];
    } else {
      return null;
    }
  }

  /**
   * +++ Useful
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === "master") {
      return this.removeProtocol(src);
    }

    var match = src.match(
      /\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i
    );

    if (match !== null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + "_" + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, "");
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol,
  };
})();

/**
 * Variant Selection scripts
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or media changes.
 *
 * @namespace variants
 */

slate.Variants = (function () {
  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.packSizeSelector = options.packSizeSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    $(this.singleOptionSelector, this.$container).on(
      "change",
      this._onSelectChange.bind(this)
    );

    $(this.packSizeSelector, this.$container).on(
      "change",
      this._onPackSizeChange.bind(this)
    );
  }

  Variants.prototype = _.assignIn({}, Variants.prototype, {
    /**
     * Get the currently selected options from add-to-cart form. Works with all
     * form input elements.
     *
     * @return {array} options - Values of currently selected variants
     */
    _getCurrentOptions: function () {
      var currentOptions = _.map(
        $(this.singleOptionSelector, this.$container),

        function (element) {
          var $element = $(element);
          var type = $element.attr("type");
          var currentOption = {};

          if (type === "radio" || type === "checkbox") {
            if ($element[0].checked) {
              currentOption.value = $element.val();
              currentOption.index = $element.data("index");

              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = $element.val();
            currentOption.index = $element.data("index");

            return currentOption;
          }
        }
      );

      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = _.compact(currentOptions);

      return currentOptions;
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selectedValues - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function () {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;

      // Listo Labs - Fix for phantom variants
      let prevColor;
      for (let i = 0; i < variants.length; i++) {
        let variant = variants[i];
        let colorOptionIndex = this.product.options.findIndex((option) =>
          option.toLowerCase().includes("color")
        );
        let sizeOptionIndex = this.product.options.findIndex((option) =>
          option.toLowerCase().includes("size")
        );
        let variantColor = variant.options[colorOptionIndex];
        if (variantColor === prevColor) {
          continue;
        } else {
          let colorSizeVariants = variants
            .filter(
              (variant) => variant.options[colorOptionIndex] == variantColor
            )
            .map((variant) => variant.options[sizeOptionIndex]);
          if (colorSizeVariants.length < 4) {
            let sizesToAdd = ["SMALL", "MEDIUM", "LARGE", "XLARGE"].filter(
              (size) => !colorSizeVariants.includes(size)
            );
            for (let j = 0; j < sizesToAdd.length; j++) {
              let size = sizesToAdd[j];
              let pseudoVariant = { ...variant };
              pseudoVariant.available = false;
              pseudoVariant.inventory_quantity = 0;
              pseudoVariant.id =
                "id-" + variantColor.replaceAll(" ", "-") + "-" + size;
              pseudoVariant.sku =
                "sku-" + variantColor.replaceAll(" ", "-") + "-" + size;
              pseudoVariant.options[colorOptionIndex] = variantColor;
              pseudoVariant.options[sizeOptionIndex] = size;
              pseudoVariant[`option${colorOptionIndex + 1}`] = variantColor;
              pseudoVariant[`option${sizeOptionIndex + 1}`] = size;
              variants.push(pseudoVariant);
            }
          }
          prevColor = variant.options[colorOptionIndex];
        }
      }

      var found = _.find(variants, function (variant) {
        return selectedValues.every(function (values) {
          return _.isEqual(variant[values.index], values.value);
        });
      });

      return found;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onSelectChange: function () {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: "variantChange",
        variant: variant,
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateMedia(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this._updatePackPricing();
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    /**
     * Trigger event when variant media changes
     *
     * @param  {object} variant - Currently selected variant
     * @return {event}  variantMediaChange
     */
    _updateMedia: function (variant) {
      var variantMedia = variant.featured_media || {};
      var currentVariantMedia = this.currentVariant.featured_media || {};

      var isMatchingPreviewImage = false;

      if (variantMedia.preview_image && currentVariantMedia.preview_image) {
        isMatchingPreviewImage =
          variantMedia.preview_image.src ===
          currentVariantMedia.preview_image.src;
      }

      if (!variant.featured_media || isMatchingPreviewImage) return;

      this.$container.trigger({
        type: "variantMediaChange",
        variant: variant,
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function (variant) {
      if (
        variant.price === this.currentVariant.price &&
        variant.compare_at_price === this.currentVariant.compare_at_price
      ) {
        return;
      }

      this.$container.trigger({
        type: "variantPriceChange",
        variant: variant,
      });
    },

    /**
     * Trigger event when variant SKU changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantSKUChange
     */
    _updateSKU: function (variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this.$container.trigger({
        type: "variantSKUChange",
        variant: variant,
      });
    },

    /**
     * Modify pricing if pack is selected
     */
    _updatePackPricing: function () {
      if (this.product.tags.includes("sock-bundle-eligible")) {
        let variant = this._getVariantFromOptions();
        let quantityInput = $("#Quantity");
        let packSize = quantityInput.val();
        // Adjust pack selector price
        let packSizeInputs = $(
          `input[name="optionsize"][id^="ProductSelect-packsize"][data-qty]`
        );
        packSizeInputs.each(function () {
          let packSizeInput = $(this);
          let packAmount = $(packSizeInput).attr("data-qty");
          let packSizeInputLabel = $(`label[for="${packSizeInput.attr("id")}"`);
          let discountPercentage =
            $(packSizeInputLabel)
              .find(".packsize-price--sale")
              .data("savings-percent") || 0;
          let priceMultiplier = (100 - discountPercentage) / 100;
          let newPrice = (
            (variant.price * priceMultiplier * packAmount) /
            100
          ).toFixed(2);
          if (packAmount == 1) {
            $(packSizeInputLabel)
              .find(".packsize-price.packsize-single")
              .html(`$${newPrice}`);
            $(packSizeInputLabel).find(".packsize-price").html(`$${newPrice}`);
            if (variant.compare_at_price > variant.price) {
              $(packSizeInputLabel)
                .find(".packsize-price--compare")
                .html("$" + (variant.compare_at_price / 100).toFixed(2));
              $(packSizeInputLabel)
                .find(".packsize-price")
                .addClass("packsize-price--sale");
            } else {
              $(packSizeInputLabel).find(".packsize-price--compare").html("");
              $(packSizeInputLabel)
                .find(".packsize-price")
                .removeClass("packsize-price--sale");
            }
          } else {
            let comparePrice = ((variant.price * packAmount) / 100).toFixed(2);
            $(packSizeInputLabel)
              .find(".packsize-price.packsize-single")
              .html(`$${newPrice}`);
            $(packSizeInputLabel)
              .find(".packsize-price.packsize-price--compare")
              .html(`$${comparePrice}`);
            $(packSizeInputLabel)
              .find(".packsize-price.packsize-price--sale")
              .html(`$${newPrice}`);
          }
        });
        if (packSize > 1) {
          // powers pack discount % shown up by the main price
          let packSizeInput = $(
            `input[name="optionsize"][id^="ProductSelect-packsize"][data-qty="${packSize}"]`
          );
          let packSizeInputLabel = $(`label[for="${packSizeInput.attr("id")}"`);
          let discountPercentage = $(packSizeInputLabel)
            .find(".packsize-price--sale")
            .data("savings-percent");
          let priceMultiplier = (100 - discountPercentage) / 100;
          let newPrice = (
            (variant.price * priceMultiplier * packSize) /
            100
          ).toFixed(2);
          let comparePrice = ((variant.price * packSize) / 100).toFixed(2);
          // Top price flags
          $("#ProductPrice").html("$" + newPrice);
          $("#ComparePrice").html("$" + comparePrice);
          $("#PackSavings").html(discountPercentage + "% bundle savings");
          $("#PackSavingsLower").html("Save " + discountPercentage + "%");
          // Lower price flags
          $("[data-pack-pricing-flag] #ProductPrice").html("$" + newPrice);
          $("[data-pack-pricing-flag] #ComparePrice").html("$" + newPrice);
          $("[data-pack-pricing-flag] #PackSavings").html(
            discountPercentage + "% bundle savings"
          );
          // Show price flags
          $("#ComparePrice").parent().removeClass("hide");
        } else {
          // Reset price
          $("#ProductPrice").html("$" + (variant.price / 100).toFixed(2));
          if (variant.compare_at_price > 1) {
            $("#ComparePrice").html(
              "$" + (variant.compare_at_price / 100).toFixed(2)
            );
          } else {
            $("#ComparePrice").parent().addClass("hide");
          }
          $("#PackSavings").html("");
          $("#PackSavingsLower").html("");
          $("[data-pack-pricing-flag] #ProductPrice").html("");
          $("[data-pack-pricing-flag] #ComparePrice").html("");
          $("[data-pack-pricing-flag] #PackSavings").html("");
          // Hide price flags
          //$('#ComparePrice').parent().addClass('hide');
        }
      }
    },

    /**
     * Update history state for product deeplinking
     *
     * @param  {variant} variant - Currently selected variant
     * @return {k}         [description]
     */
    _updateHistoryState: function (variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        "?variant=" +
        variant.id;
      window.history.replaceState(
        {
          path: newurl,
        },
        "",
        newurl
      );
    },

    /**
     * Update hidden master select of variant change
     *
     * @param  {variant} variant - Currently selected variant
     */
    _updateMasterSelect: function (variant) {
      $(this.originalSelectorId, this.$container).val(variant.id);
    },

    /**
     * Handle pack size change
     *
     * @param  {event} event - Input change event
     */
    _onPackSizeChange: function (event) {
      var input = $(event.target);
      var inputLabel = $(
        "label[for='" +
          input.parent().attr("id") +
          "'] .single-option-selected-value"
      );
      var quantyInput = $("#Quantity");

      inputLabel.text(input.val());
      quantyInput.val(input.data("qty"));
      this._updatePackPricing();
    },
  });

  return Variants;
})();

window.slate = window.slate || {};

/**
 * Slate utilities
 * A collection of useful utilities to help build your theme
 *
 *
 * @namespace utils
 */

slate.utils = {
  keyboardKeys: {
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    LEFTARROW: 37,
    RIGHTARROW: 39,
  },
};

/* ================ GLOBAL ================ */
theme.LibraryLoader = (function () {
  var types = {
    link: "link",
    script: "script",
  };

  var status = {
    requested: "requested",
    loaded: "loaded",
  };

  var cloudCdn = "https://cdn.shopify.com/shopifycloud/";

  var libraries = {
    youtubeSdk: {
      tagId: "youtube-sdk",
      src: "https://www.youtube.com/iframe_api",
      type: types.script,
    },
    plyrShopifyStyles: {
      tagId: "plyr-shopify-styles",
      src: cloudCdn + "shopify-plyr/v1.0/shopify-plyr.css",
      type: types.link,
    },
    modelViewerUiStyles: {
      tagId: "shopify-model-viewer-ui-styles",
      src: cloudCdn + "model-viewer-ui/assets/v1.0/model-viewer-ui.css",
      type: types.link,
    },
  };

  function load(libraryName, callback) {
    var library = libraries[libraryName];

    if (!library) return;
    if (library.status === status.requested) return;

    callback = callback || function () {};
    if (library.status === status.loaded) {
      callback();
      return;
    }

    library.status = status.requested;

    var tag;

    switch (library.type) {
      case types.script:
        tag = createScriptTag(library, callback);
        break;
      case types.link:
        tag = createLinkTag(library, callback);
        break;
    }

    tag.id = library.tagId;
    library.element = tag;

    var firstScriptTag = document.getElementsByTagName(library.type)[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function createScriptTag(library, callback) {
    var tag = document.createElement("script");
    tag.src = library.src;
    tag.addEventListener("load", function () {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  function createLinkTag(library, callback) {
    var tag = document.createElement("link");
    tag.href = library.src;
    tag.rel = "stylesheet";
    tag.type = "text/css";
    tag.addEventListener("load", function () {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  return {
    load: load,
  };
})();

/* ================ MODULES ================ */

/*============================================================================
  Ajax the add to cart experience by revealing it in a side drawer
  Plugin Documentation - http://shopify.github.io/Timber/#ajax-cart
  (c) Copyright 2015 Shopify Inc. Author: Carson Shold (@cshold). All Rights Reserved.

  This file includes:
    - Basic Shopify Ajax API calls
    - Ajax cart plugin

  This requires:
    - jQuery 1.8+
    - handlebars.min.js (for cart template)
    - modernizer.min.js
    - snippet/ajax-cart-template.liquid

  Customized version of Shopify's jQuery API
  (c) Copyright 2009-2015 Shopify Inc. Author: Caroline Schnapp. All Rights Reserved.
==============================================================================*/

var Handlebars = (function () {
  var e = (function () {
    "use strict";
    function t(e) {
      this.string = e;
    }
    var e;
    t.prototype.toString = function () {
      return "" + this.string;
    };
    e = t;
    return e;
  })();
  var t = (function (e) {
    "use strict";
    function o(e) {
      return r[e] || "&";
    }
    function u(e, t) {
      for (var n in t) {
        if (Object.prototype.hasOwnProperty.call(t, n)) {
          e[n] = t[n];
        }
      }
    }
    function c(e) {
      if (e instanceof n) {
        return e.toString();
      } else if (!e && e !== 0) {
        return "";
      }
      e = "" + e;
      if (!s.test(e)) {
        return e;
      }
      return e.replace(i, o);
    }
    function h(e) {
      if (!e && e !== 0) {
        return true;
      } else if (l(e) && e.length === 0) {
        return true;
      } else {
        return false;
      }
    }
    var t = {};
    var n = e;
    var r = {
      "&": "&",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;",
    };
    var i = /[&<>"'`]/g;
    var s = /[&<>"'`]/;
    t.extend = u;
    var a = Object.prototype.toString;
    t.toString = a;
    var f = function (e) {
      return typeof e === "function";
    };
    if (f(/x/)) {
      f = function (e) {
        return typeof e === "function" && a.call(e) === "[object Function]";
      };
    }
    var f;
    t.isFunction = f;
    var l =
      Array.isArray ||
      function (e) {
        return e && typeof e === "object"
          ? a.call(e) === "[object Array]"
          : false;
      };
    t.isArray = l;
    t.escapeExpression = c;
    t.isEmpty = h;
    return t;
  })(e);
  var n = (function () {
    "use strict";
    function n(e, n) {
      var r;
      if (n && n.firstLine) {
        r = n.firstLine;
        e += " - " + r + ":" + n.firstColumn;
      }
      var i = Error.prototype.constructor.call(this, e);
      for (var s = 0; s < t.length; s++) {
        this[t[s]] = i[t[s]];
      }
      if (r) {
        this.lineNumber = r;
        this.column = n.firstColumn;
      }
    }
    var e;
    var t = [
      "description",
      "fileName",
      "lineNumber",
      "message",
      "name",
      "number",
      "stack",
    ];
    n.prototype = new Error();
    e = n;
    return e;
  })();
  var r = (function (e, t) {
    "use strict";
    function h(e, t) {
      this.helpers = e || {};
      this.partials = t || {};
      p(this);
    }
    function p(e) {
      e.registerHelper("helperMissing", function (e) {
        if (arguments.length === 2) {
          return undefined;
        } else {
          throw new i("Missing helper: '" + e + "'");
        }
      });
      e.registerHelper("blockHelperMissing", function (t, n) {
        var r = n.inverse || function () {},
          i = n.fn;
        if (f(t)) {
          t = t.call(this);
        }
        if (t === true) {
          return i(this);
        } else if (t === false || t == null) {
          return r(this);
        } else if (a(t)) {
          if (t.length > 0) {
            return e.helpers.each(t, n);
          } else {
            return r(this);
          }
        } else {
          return i(t);
        }
      });
      e.registerHelper("each", function (e, t) {
        var n = t.fn,
          r = t.inverse;
        var i = 0,
          s = "",
          o;
        if (f(e)) {
          e = e.call(this);
        }
        if (t.data) {
          o = m(t.data);
        }
        if (e && typeof e === "object") {
          if (a(e)) {
            for (var u = e.length; i < u; i++) {
              if (o) {
                o.index = i;
                o.first = i === 0;
                o.last = i === e.length - 1;
              }
              s = s + n(e[i], { data: o });
            }
          } else {
            for (var l in e) {
              if (e.hasOwnProperty(l)) {
                if (o) {
                  o.key = l;
                  o.index = i;
                  o.first = i === 0;
                }
                s = s + n(e[l], { data: o });
                i++;
              }
            }
          }
        }
        if (i === 0) {
          s = r(this);
        }
        return s;
      });
      e.registerHelper("if", function (e, t) {
        if (f(e)) {
          e = e.call(this);
        }
        if ((!t.hash.includeZero && !e) || r.isEmpty(e)) {
          return t.inverse(this);
        } else {
          return t.fn(this);
        }
      });
      e.registerHelper("unless", function (t, n) {
        return e.helpers["if"].call(this, t, {
          fn: n.inverse,
          inverse: n.fn,
          hash: n.hash,
        });
      });
      e.registerHelper("with", function (e, t) {
        if (f(e)) {
          e = e.call(this);
        }
        if (!r.isEmpty(e)) return t.fn(e);
      });
      e.registerHelper("log", function (t, n) {
        var r = n.data && n.data.level != null ? parseInt(n.data.level, 10) : 1;
        e.log(r, t);
      });
    }
    function v(e, t) {
      d.log(e, t);
    }
    var n = {};
    var r = e;
    var i = t;
    var s = "1.3.0";
    n.VERSION = s;
    var o = 4;
    n.COMPILER_REVISION = o;
    var u = {
      1: "<= 1.0.rc.2",
      2: "== 1.0.0-rc.3",
      3: "== 1.0.0-rc.4",
      4: ">= 1.0.0",
    };
    n.REVISION_CHANGES = u;
    var a = r.isArray,
      f = r.isFunction,
      l = r.toString,
      c = "[object Object]";
    n.HandlebarsEnvironment = h;
    h.prototype = {
      constructor: h,
      logger: d,
      log: v,
      registerHelper: function (e, t, n) {
        if (l.call(e) === c) {
          if (n || t) {
            throw new i("Arg not supported with multiple helpers");
          }
          r.extend(this.helpers, e);
        } else {
          if (n) {
            t.not = n;
          }
          this.helpers[e] = t;
        }
      },
      registerPartial: function (e, t) {
        if (l.call(e) === c) {
          r.extend(this.partials, e);
        } else {
          this.partials[e] = t;
        }
      },
    };
    var d = {
      methodMap: { 0: "debug", 1: "info", 2: "warn", 3: "error" },
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      level: 3,
      log: function (e, t) {
        if (d.level <= e) {
          var n = d.methodMap[e];
          if (typeof console !== "undefined" && console[n]) {
            console[n].call(console, t);
          }
        }
      },
    };
    n.logger = d;
    n.log = v;
    var m = function (e) {
      var t = {};
      r.extend(t, e);
      return t;
    };
    n.createFrame = m;
    return n;
  })(t, n);
  var i = (function (e, t, n) {
    "use strict";
    function a(e) {
      var t = (e && e[0]) || 1,
        n = o;
      if (t !== n) {
        if (t < n) {
          var r = u[n],
            i = u[t];
          throw new s(
            "Template was precompiled with an older version of Handlebars than the current runtime. " +
              "Please update your precompiler to a newer version (" +
              r +
              ") or downgrade your runtime to an older version (" +
              i +
              ")."
          );
        } else {
          throw new s(
            "Template was precompiled with a newer version of Handlebars than the current runtime. " +
              "Please update your runtime to a newer version (" +
              e[1] +
              ")."
          );
        }
      }
    }
    function f(e, t) {
      if (!t) {
        throw new s("No environment passed to template");
      }
      var n = function (e, n, r, i, o, u) {
        var a = t.VM.invokePartial.apply(this, arguments);
        if (a != null) {
          return a;
        }
        if (t.compile) {
          var f = { helpers: i, partials: o, data: u };
          o[n] = t.compile(e, { data: u !== undefined }, t);
          return o[n](r, f);
        } else {
          throw new s(
            "The partial " +
              n +
              " could not be compiled when running in runtime-only mode"
          );
        }
      };
      var r = {
        escapeExpression: i.escapeExpression,
        invokePartial: n,
        programs: [],
        program: function (e, t, n) {
          var r = this.programs[e];
          if (n) {
            r = c(e, t, n);
          } else if (!r) {
            r = this.programs[e] = c(e, t);
          }
          return r;
        },
        merge: function (e, t) {
          var n = e || t;
          if (e && t && e !== t) {
            n = {};
            i.extend(n, t);
            i.extend(n, e);
          }
          return n;
        },
        programWithDepth: t.VM.programWithDepth,
        noop: t.VM.noop,
        compilerInfo: null,
      };
      return function (n, i) {
        i = i || {};
        var s = i.partial ? i : t,
          o,
          u;
        if (!i.partial) {
          o = i.helpers;
          u = i.partials;
        }
        var a = e.call(r, s, n, o, u, i.data);
        if (!i.partial) {
          t.VM.checkRevision(r.compilerInfo);
        }
        return a;
      };
    }
    function l(e, t, n) {
      var r = Array.prototype.slice.call(arguments, 3);
      var i = function (e, i) {
        i = i || {};
        return t.apply(this, [e, i.data || n].concat(r));
      };
      i.program = e;
      i.depth = r.length;
      return i;
    }
    function c(e, t, n) {
      var r = function (e, r) {
        r = r || {};
        return t(e, r.data || n);
      };
      r.program = e;
      r.depth = 0;
      return r;
    }
    function h(e, t, n, r, i, o) {
      var u = { partial: true, helpers: r, partials: i, data: o };
      if (e === undefined) {
        throw new s("The partial " + t + " could not be found");
      } else if (e instanceof Function) {
        return e(n, u);
      }
    }
    function p() {
      return "";
    }
    var r = {};
    var i = e;
    var s = t;
    var o = n.COMPILER_REVISION;
    var u = n.REVISION_CHANGES;
    r.checkRevision = a;
    r.template = f;
    r.programWithDepth = l;
    r.program = c;
    r.invokePartial = h;
    r.noop = p;
    return r;
  })(t, n, r);
  var s = (function (e, t, n, r, i) {
    "use strict";
    var s;
    var o = e;
    var u = t;
    var a = n;
    var f = r;
    var l = i;
    var c = function () {
      var e = new o.HandlebarsEnvironment();
      f.extend(e, o);
      e.SafeString = u;
      e.Exception = a;
      e.Utils = f;
      e.VM = l;
      e.template = function (t) {
        return l.template(t, e);
      };
      return e;
    };
    var h = c();
    h.create = c;
    s = h;
    return s;
  })(r, e, n, t, i);
  var o = (function (e) {
    "use strict";
    function r(e) {
      e = e || {};
      this.firstLine = e.first_line;
      this.firstColumn = e.first_column;
      this.lastColumn = e.last_column;
      this.lastLine = e.last_line;
    }
    var t;
    var n = e;
    var i = {
      ProgramNode: function (e, t, n, s) {
        var o, u;
        if (arguments.length === 3) {
          s = n;
          n = null;
        } else if (arguments.length === 2) {
          s = t;
          t = null;
        }
        r.call(this, s);
        this.type = "program";
        this.statements = e;
        this.strip = {};
        if (n) {
          u = n[0];
          if (u) {
            o = {
              first_line: u.firstLine,
              last_line: u.lastLine,
              last_column: u.lastColumn,
              first_column: u.firstColumn,
            };
            this.inverse = new i.ProgramNode(n, t, o);
          } else {
            this.inverse = new i.ProgramNode(n, t);
          }
          this.strip.right = t.left;
        } else if (t) {
          this.strip.left = t.right;
        }
      },
      MustacheNode: function (e, t, n, s, o) {
        r.call(this, o);
        this.type = "mustache";
        this.strip = s;
        if (n != null && n.charAt) {
          var u = n.charAt(3) || n.charAt(2);
          this.escaped = u !== "{" && u !== "&";
        } else {
          this.escaped = !!n;
        }
        if (e instanceof i.SexprNode) {
          this.sexpr = e;
        } else {
          this.sexpr = new i.SexprNode(e, t);
        }
        this.sexpr.isRoot = true;
        this.id = this.sexpr.id;
        this.params = this.sexpr.params;
        this.hash = this.sexpr.hash;
        this.eligibleHelper = this.sexpr.eligibleHelper;
        this.isHelper = this.sexpr.isHelper;
      },
      SexprNode: function (e, t, n) {
        r.call(this, n);
        this.type = "sexpr";
        this.hash = t;
        var i = (this.id = e[0]);
        var s = (this.params = e.slice(1));
        var o = (this.eligibleHelper = i.isSimple);
        this.isHelper = o && (s.length || t);
      },
      PartialNode: function (e, t, n, i) {
        r.call(this, i);
        this.type = "partial";
        this.partialName = e;
        this.context = t;
        this.strip = n;
      },
      BlockNode: function (e, t, i, s, o) {
        r.call(this, o);
        if (e.sexpr.id.original !== s.path.original) {
          throw new n(
            e.sexpr.id.original + " doesn't match " + s.path.original,
            this
          );
        }
        this.type = "block";
        this.mustache = e;
        this.program = t;
        this.inverse = i;
        this.strip = { left: e.strip.left, right: s.strip.right };
        (t || i).strip.left = e.strip.right;
        (i || t).strip.right = s.strip.left;
        if (i && !t) {
          this.isInverse = true;
        }
      },
      ContentNode: function (e, t) {
        r.call(this, t);
        this.type = "content";
        this.string = e;
      },
      HashNode: function (e, t) {
        r.call(this, t);
        this.type = "hash";
        this.pairs = e;
      },
      IdNode: function (e, t) {
        r.call(this, t);
        this.type = "ID";
        var i = "",
          s = [],
          o = 0;
        for (var u = 0, a = e.length; u < a; u++) {
          var f = e[u].part;
          i += (e[u].separator || "") + f;
          if (f === ".." || f === "." || f === "this") {
            if (s.length > 0) {
              throw new n("Invalid path: " + i, this);
            } else if (f === "..") {
              o++;
            } else {
              this.isScoped = true;
            }
          } else {
            s.push(f);
          }
        }
        this.original = i;
        this.parts = s;
        this.string = s.join(".");
        this.depth = o;
        this.isSimple = e.length === 1 && !this.isScoped && o === 0;
        this.stringModeValue = this.string;
      },
      PartialNameNode: function (e, t) {
        r.call(this, t);
        this.type = "PARTIAL_NAME";
        this.name = e.original;
      },
      DataNode: function (e, t) {
        r.call(this, t);
        this.type = "DATA";
        this.id = e;
      },
      StringNode: function (e, t) {
        r.call(this, t);
        this.type = "STRING";
        this.original = this.string = this.stringModeValue = e;
      },
      IntegerNode: function (e, t) {
        r.call(this, t);
        this.type = "INTEGER";
        this.original = this.integer = e;
        this.stringModeValue = Number(e);
      },
      BooleanNode: function (e, t) {
        r.call(this, t);
        this.type = "BOOLEAN";
        this.bool = e;
        this.stringModeValue = e === "true";
      },
      CommentNode: function (e, t) {
        r.call(this, t);
        this.type = "comment";
        this.comment = e;
      },
    };
    t = i;
    return t;
  })(n);
  var u = (function () {
    "use strict";
    var e;
    var t = (function () {
      function t(e, t) {
        return {
          left: e.charAt(2) === "~",
          right: t.charAt(0) === "~" || t.charAt(1) === "~",
        };
      }
      function r() {
        this.yy = {};
      }
      var e = {
        trace: function () {},
        yy: {},
        symbols_: {
          error: 2,
          root: 3,
          statements: 4,
          EOF: 5,
          program: 6,
          simpleInverse: 7,
          statement: 8,
          openInverse: 9,
          closeBlock: 10,
          openBlock: 11,
          mustache: 12,
          partial: 13,
          CONTENT: 14,
          COMMENT: 15,
          OPEN_BLOCK: 16,
          sexpr: 17,
          CLOSE: 18,
          OPEN_INVERSE: 19,
          OPEN_ENDBLOCK: 20,
          path: 21,
          OPEN: 22,
          OPEN_UNESCAPED: 23,
          CLOSE_UNESCAPED: 24,
          OPEN_PARTIAL: 25,
          partialName: 26,
          partial_option0: 27,
          sexpr_repetition0: 28,
          sexpr_option0: 29,
          dataName: 30,
          param: 31,
          STRING: 32,
          INTEGER: 33,
          BOOLEAN: 34,
          OPEN_SEXPR: 35,
          CLOSE_SEXPR: 36,
          hash: 37,
          hash_repetition_plus0: 38,
          hashSegment: 39,
          ID: 40,
          EQUALS: 41,
          DATA: 42,
          pathSegments: 43,
          SEP: 44,
          $accept: 0,
          $end: 1,
        },
        terminals_: {
          2: "error",
          5: "EOF",
          14: "CONTENT",
          15: "COMMENT",
          16: "OPEN_BLOCK",
          18: "CLOSE",
          19: "OPEN_INVERSE",
          20: "OPEN_ENDBLOCK",
          22: "OPEN",
          23: "OPEN_UNESCAPED",
          24: "CLOSE_UNESCAPED",
          25: "OPEN_PARTIAL",
          32: "STRING",
          33: "INTEGER",
          34: "BOOLEAN",
          35: "OPEN_SEXPR",
          36: "CLOSE_SEXPR",
          40: "ID",
          41: "EQUALS",
          42: "DATA",
          44: "SEP",
        },
        productions_: [
          0,
          [3, 2],
          [3, 1],
          [6, 2],
          [6, 3],
          [6, 2],
          [6, 1],
          [6, 1],
          [6, 0],
          [4, 1],
          [4, 2],
          [8, 3],
          [8, 3],
          [8, 1],
          [8, 1],
          [8, 1],
          [8, 1],
          [11, 3],
          [9, 3],
          [10, 3],
          [12, 3],
          [12, 3],
          [13, 4],
          [7, 2],
          [17, 3],
          [17, 1],
          [31, 1],
          [31, 1],
          [31, 1],
          [31, 1],
          [31, 1],
          [31, 3],
          [37, 1],
          [39, 3],
          [26, 1],
          [26, 1],
          [26, 1],
          [30, 2],
          [21, 1],
          [43, 3],
          [43, 1],
          [27, 0],
          [27, 1],
          [28, 0],
          [28, 2],
          [29, 0],
          [29, 1],
          [38, 1],
          [38, 2],
        ],
        performAction: function (n, r, i, s, o, u, a) {
          var f = u.length - 1;
          switch (o) {
            case 1:
              return new s.ProgramNode(u[f - 1], this._$);
              break;
            case 2:
              return new s.ProgramNode([], this._$);
              break;
            case 3:
              this.$ = new s.ProgramNode([], u[f - 1], u[f], this._$);
              break;
            case 4:
              this.$ = new s.ProgramNode(u[f - 2], u[f - 1], u[f], this._$);
              break;
            case 5:
              this.$ = new s.ProgramNode(u[f - 1], u[f], [], this._$);
              break;
            case 6:
              this.$ = new s.ProgramNode(u[f], this._$);
              break;
            case 7:
              this.$ = new s.ProgramNode([], this._$);
              break;
            case 8:
              this.$ = new s.ProgramNode([], this._$);
              break;
            case 9:
              this.$ = [u[f]];
              break;
            case 10:
              u[f - 1].push(u[f]);
              this.$ = u[f - 1];
              break;
            case 11:
              this.$ = new s.BlockNode(
                u[f - 2],
                u[f - 1].inverse,
                u[f - 1],
                u[f],
                this._$
              );
              break;
            case 12:
              this.$ = new s.BlockNode(
                u[f - 2],
                u[f - 1],
                u[f - 1].inverse,
                u[f],
                this._$
              );
              break;
            case 13:
              this.$ = u[f];
              break;
            case 14:
              this.$ = u[f];
              break;
            case 15:
              this.$ = new s.ContentNode(u[f], this._$);
              break;
            case 16:
              this.$ = new s.CommentNode(u[f], this._$);
              break;
            case 17:
              this.$ = new s.MustacheNode(
                u[f - 1],
                null,
                u[f - 2],
                t(u[f - 2], u[f]),
                this._$
              );
              break;
            case 18:
              this.$ = new s.MustacheNode(
                u[f - 1],
                null,
                u[f - 2],
                t(u[f - 2], u[f]),
                this._$
              );
              break;
            case 19:
              this.$ = { path: u[f - 1], strip: t(u[f - 2], u[f]) };
              break;
            case 20:
              this.$ = new s.MustacheNode(
                u[f - 1],
                null,
                u[f - 2],
                t(u[f - 2], u[f]),
                this._$
              );
              break;
            case 21:
              this.$ = new s.MustacheNode(
                u[f - 1],
                null,
                u[f - 2],
                t(u[f - 2], u[f]),
                this._$
              );
              break;
            case 22:
              this.$ = new s.PartialNode(
                u[f - 2],
                u[f - 1],
                t(u[f - 3], u[f]),
                this._$
              );
              break;
            case 23:
              this.$ = t(u[f - 1], u[f]);
              break;
            case 24:
              this.$ = new s.SexprNode(
                [u[f - 2]].concat(u[f - 1]),
                u[f],
                this._$
              );
              break;
            case 25:
              this.$ = new s.SexprNode([u[f]], null, this._$);
              break;
            case 26:
              this.$ = u[f];
              break;
            case 27:
              this.$ = new s.StringNode(u[f], this._$);
              break;
            case 28:
              this.$ = new s.IntegerNode(u[f], this._$);
              break;
            case 29:
              this.$ = new s.BooleanNode(u[f], this._$);
              break;
            case 30:
              this.$ = u[f];
              break;
            case 31:
              u[f - 1].isHelper = true;
              this.$ = u[f - 1];
              break;
            case 32:
              this.$ = new s.HashNode(u[f], this._$);
              break;
            case 33:
              this.$ = [u[f - 2], u[f]];
              break;
            case 34:
              this.$ = new s.PartialNameNode(u[f], this._$);
              break;
            case 35:
              this.$ = new s.PartialNameNode(
                new s.StringNode(u[f], this._$),
                this._$
              );
              break;
            case 36:
              this.$ = new s.PartialNameNode(new s.IntegerNode(u[f], this._$));
              break;
            case 37:
              this.$ = new s.DataNode(u[f], this._$);
              break;
            case 38:
              this.$ = new s.IdNode(u[f], this._$);
              break;
            case 39:
              u[f - 2].push({ part: u[f], separator: u[f - 1] });
              this.$ = u[f - 2];
              break;
            case 40:
              this.$ = [{ part: u[f] }];
              break;
            case 43:
              this.$ = [];
              break;
            case 44:
              u[f - 1].push(u[f]);
              break;
            case 47:
              this.$ = [u[f]];
              break;
            case 48:
              u[f - 1].push(u[f]);
              break;
          }
        },
        table: [
          {
            3: 1,
            4: 2,
            5: [1, 3],
            8: 4,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          { 1: [3] },
          {
            5: [1, 16],
            8: 17,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          { 1: [2, 2] },
          {
            5: [2, 9],
            14: [2, 9],
            15: [2, 9],
            16: [2, 9],
            19: [2, 9],
            20: [2, 9],
            22: [2, 9],
            23: [2, 9],
            25: [2, 9],
          },
          {
            4: 20,
            6: 18,
            7: 19,
            8: 4,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 21],
            20: [2, 8],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            4: 20,
            6: 22,
            7: 19,
            8: 4,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 21],
            20: [2, 8],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            5: [2, 13],
            14: [2, 13],
            15: [2, 13],
            16: [2, 13],
            19: [2, 13],
            20: [2, 13],
            22: [2, 13],
            23: [2, 13],
            25: [2, 13],
          },
          {
            5: [2, 14],
            14: [2, 14],
            15: [2, 14],
            16: [2, 14],
            19: [2, 14],
            20: [2, 14],
            22: [2, 14],
            23: [2, 14],
            25: [2, 14],
          },
          {
            5: [2, 15],
            14: [2, 15],
            15: [2, 15],
            16: [2, 15],
            19: [2, 15],
            20: [2, 15],
            22: [2, 15],
            23: [2, 15],
            25: [2, 15],
          },
          {
            5: [2, 16],
            14: [2, 16],
            15: [2, 16],
            16: [2, 16],
            19: [2, 16],
            20: [2, 16],
            22: [2, 16],
            23: [2, 16],
            25: [2, 16],
          },
          { 17: 23, 21: 24, 30: 25, 40: [1, 28], 42: [1, 27], 43: 26 },
          { 17: 29, 21: 24, 30: 25, 40: [1, 28], 42: [1, 27], 43: 26 },
          { 17: 30, 21: 24, 30: 25, 40: [1, 28], 42: [1, 27], 43: 26 },
          { 17: 31, 21: 24, 30: 25, 40: [1, 28], 42: [1, 27], 43: 26 },
          { 21: 33, 26: 32, 32: [1, 34], 33: [1, 35], 40: [1, 28], 43: 26 },
          { 1: [2, 1] },
          {
            5: [2, 10],
            14: [2, 10],
            15: [2, 10],
            16: [2, 10],
            19: [2, 10],
            20: [2, 10],
            22: [2, 10],
            23: [2, 10],
            25: [2, 10],
          },
          { 10: 36, 20: [1, 37] },
          {
            4: 38,
            8: 4,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            20: [2, 7],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            7: 39,
            8: 17,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 21],
            20: [2, 6],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            17: 23,
            18: [1, 40],
            21: 24,
            30: 25,
            40: [1, 28],
            42: [1, 27],
            43: 26,
          },
          { 10: 41, 20: [1, 37] },
          { 18: [1, 42] },
          {
            18: [2, 43],
            24: [2, 43],
            28: 43,
            32: [2, 43],
            33: [2, 43],
            34: [2, 43],
            35: [2, 43],
            36: [2, 43],
            40: [2, 43],
            42: [2, 43],
          },
          { 18: [2, 25], 24: [2, 25], 36: [2, 25] },
          {
            18: [2, 38],
            24: [2, 38],
            32: [2, 38],
            33: [2, 38],
            34: [2, 38],
            35: [2, 38],
            36: [2, 38],
            40: [2, 38],
            42: [2, 38],
            44: [1, 44],
          },
          { 21: 45, 40: [1, 28], 43: 26 },
          {
            18: [2, 40],
            24: [2, 40],
            32: [2, 40],
            33: [2, 40],
            34: [2, 40],
            35: [2, 40],
            36: [2, 40],
            40: [2, 40],
            42: [2, 40],
            44: [2, 40],
          },
          { 18: [1, 46] },
          { 18: [1, 47] },
          { 24: [1, 48] },
          { 18: [2, 41], 21: 50, 27: 49, 40: [1, 28], 43: 26 },
          { 18: [2, 34], 40: [2, 34] },
          { 18: [2, 35], 40: [2, 35] },
          { 18: [2, 36], 40: [2, 36] },
          {
            5: [2, 11],
            14: [2, 11],
            15: [2, 11],
            16: [2, 11],
            19: [2, 11],
            20: [2, 11],
            22: [2, 11],
            23: [2, 11],
            25: [2, 11],
          },
          { 21: 51, 40: [1, 28], 43: 26 },
          {
            8: 17,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            20: [2, 3],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            4: 52,
            8: 4,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            20: [2, 5],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          {
            14: [2, 23],
            15: [2, 23],
            16: [2, 23],
            19: [2, 23],
            20: [2, 23],
            22: [2, 23],
            23: [2, 23],
            25: [2, 23],
          },
          {
            5: [2, 12],
            14: [2, 12],
            15: [2, 12],
            16: [2, 12],
            19: [2, 12],
            20: [2, 12],
            22: [2, 12],
            23: [2, 12],
            25: [2, 12],
          },
          {
            14: [2, 18],
            15: [2, 18],
            16: [2, 18],
            19: [2, 18],
            20: [2, 18],
            22: [2, 18],
            23: [2, 18],
            25: [2, 18],
          },
          {
            18: [2, 45],
            21: 56,
            24: [2, 45],
            29: 53,
            30: 60,
            31: 54,
            32: [1, 57],
            33: [1, 58],
            34: [1, 59],
            35: [1, 61],
            36: [2, 45],
            37: 55,
            38: 62,
            39: 63,
            40: [1, 64],
            42: [1, 27],
            43: 26,
          },
          { 40: [1, 65] },
          {
            18: [2, 37],
            24: [2, 37],
            32: [2, 37],
            33: [2, 37],
            34: [2, 37],
            35: [2, 37],
            36: [2, 37],
            40: [2, 37],
            42: [2, 37],
          },
          {
            14: [2, 17],
            15: [2, 17],
            16: [2, 17],
            19: [2, 17],
            20: [2, 17],
            22: [2, 17],
            23: [2, 17],
            25: [2, 17],
          },
          {
            5: [2, 20],
            14: [2, 20],
            15: [2, 20],
            16: [2, 20],
            19: [2, 20],
            20: [2, 20],
            22: [2, 20],
            23: [2, 20],
            25: [2, 20],
          },
          {
            5: [2, 21],
            14: [2, 21],
            15: [2, 21],
            16: [2, 21],
            19: [2, 21],
            20: [2, 21],
            22: [2, 21],
            23: [2, 21],
            25: [2, 21],
          },
          { 18: [1, 66] },
          { 18: [2, 42] },
          { 18: [1, 67] },
          {
            8: 17,
            9: 5,
            11: 6,
            12: 7,
            13: 8,
            14: [1, 9],
            15: [1, 10],
            16: [1, 12],
            19: [1, 11],
            20: [2, 4],
            22: [1, 13],
            23: [1, 14],
            25: [1, 15],
          },
          { 18: [2, 24], 24: [2, 24], 36: [2, 24] },
          {
            18: [2, 44],
            24: [2, 44],
            32: [2, 44],
            33: [2, 44],
            34: [2, 44],
            35: [2, 44],
            36: [2, 44],
            40: [2, 44],
            42: [2, 44],
          },
          { 18: [2, 46], 24: [2, 46], 36: [2, 46] },
          {
            18: [2, 26],
            24: [2, 26],
            32: [2, 26],
            33: [2, 26],
            34: [2, 26],
            35: [2, 26],
            36: [2, 26],
            40: [2, 26],
            42: [2, 26],
          },
          {
            18: [2, 27],
            24: [2, 27],
            32: [2, 27],
            33: [2, 27],
            34: [2, 27],
            35: [2, 27],
            36: [2, 27],
            40: [2, 27],
            42: [2, 27],
          },
          {
            18: [2, 28],
            24: [2, 28],
            32: [2, 28],
            33: [2, 28],
            34: [2, 28],
            35: [2, 28],
            36: [2, 28],
            40: [2, 28],
            42: [2, 28],
          },
          {
            18: [2, 29],
            24: [2, 29],
            32: [2, 29],
            33: [2, 29],
            34: [2, 29],
            35: [2, 29],
            36: [2, 29],
            40: [2, 29],
            42: [2, 29],
          },
          {
            18: [2, 30],
            24: [2, 30],
            32: [2, 30],
            33: [2, 30],
            34: [2, 30],
            35: [2, 30],
            36: [2, 30],
            40: [2, 30],
            42: [2, 30],
          },
          { 17: 68, 21: 24, 30: 25, 40: [1, 28], 42: [1, 27], 43: 26 },
          { 18: [2, 32], 24: [2, 32], 36: [2, 32], 39: 69, 40: [1, 70] },
          { 18: [2, 47], 24: [2, 47], 36: [2, 47], 40: [2, 47] },
          {
            18: [2, 40],
            24: [2, 40],
            32: [2, 40],
            33: [2, 40],
            34: [2, 40],
            35: [2, 40],
            36: [2, 40],
            40: [2, 40],
            41: [1, 71],
            42: [2, 40],
            44: [2, 40],
          },
          {
            18: [2, 39],
            24: [2, 39],
            32: [2, 39],
            33: [2, 39],
            34: [2, 39],
            35: [2, 39],
            36: [2, 39],
            40: [2, 39],
            42: [2, 39],
            44: [2, 39],
          },
          {
            5: [2, 22],
            14: [2, 22],
            15: [2, 22],
            16: [2, 22],
            19: [2, 22],
            20: [2, 22],
            22: [2, 22],
            23: [2, 22],
            25: [2, 22],
          },
          {
            5: [2, 19],
            14: [2, 19],
            15: [2, 19],
            16: [2, 19],
            19: [2, 19],
            20: [2, 19],
            22: [2, 19],
            23: [2, 19],
            25: [2, 19],
          },
          { 36: [1, 72] },
          { 18: [2, 48], 24: [2, 48], 36: [2, 48], 40: [2, 48] },
          { 41: [1, 71] },
          {
            21: 56,
            30: 60,
            31: 73,
            32: [1, 57],
            33: [1, 58],
            34: [1, 59],
            35: [1, 61],
            40: [1, 28],
            42: [1, 27],
            43: 26,
          },
          {
            18: [2, 31],
            24: [2, 31],
            32: [2, 31],
            33: [2, 31],
            34: [2, 31],
            35: [2, 31],
            36: [2, 31],
            40: [2, 31],
            42: [2, 31],
          },
          { 18: [2, 33], 24: [2, 33], 36: [2, 33], 40: [2, 33] },
        ],
        defaultActions: { 3: [2, 2], 16: [2, 1], 50: [2, 42] },
        parseError: function (t, n) {
          throw new Error(t);
        },
        parse: function (t) {
          function v(e) {
            r.length = r.length - 2 * e;
            i.length = i.length - e;
            s.length = s.length - e;
          }
          function m() {
            var e;
            e = n.lexer.lex() || 1;
            if (typeof e !== "number") {
              e = n.symbols_[e] || e;
            }
            return e;
          }
          var n = this,
            r = [0],
            i = [null],
            s = [],
            o = this.table,
            u = "",
            a = 0,
            f = 0,
            l = 0,
            c = 2,
            h = 1;
          this.lexer.setInput(t);
          this.lexer.yy = this.yy;
          this.yy.lexer = this.lexer;
          this.yy.parser = this;
          if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
          var p = this.lexer.yylloc;
          s.push(p);
          var d = this.lexer.options && this.lexer.options.ranges;
          if (typeof this.yy.parseError === "function")
            this.parseError = this.yy.parseError;
          var g,
            y,
            b,
            w,
            E,
            S,
            x = {},
            T,
            N,
            C,
            k;
          while (true) {
            b = r[r.length - 1];
            if (this.defaultActions[b]) {
              w = this.defaultActions[b];
            } else {
              if (g === null || typeof g == "undefined") {
                g = m();
              }
              w = o[b] && o[b][g];
            }
            if (typeof w === "undefined" || !w.length || !w[0]) {
              var L = "";
              if (!l) {
                k = [];
                for (T in o[b])
                  if (this.terminals_[T] && T > 2) {
                    k.push("'" + this.terminals_[T] + "'");
                  }
                if (this.lexer.showPosition) {
                  L =
                    "Parse error on line " +
                    (a + 1) +
                    ":\n" +
                    this.lexer.showPosition() +
                    "\nExpecting " +
                    k.join(", ") +
                    ", got '" +
                    (this.terminals_[g] || g) +
                    "'";
                } else {
                  L =
                    "Parse error on line " +
                    (a + 1) +
                    ": Unexpected " +
                    (g == 1
                      ? "end of input"
                      : "'" + (this.terminals_[g] || g) + "'");
                }
                this.parseError(L, {
                  text: this.lexer.match,
                  token: this.terminals_[g] || g,
                  line: this.lexer.yylineno,
                  loc: p,
                  expected: k,
                });
              }
            }
            if (w[0] instanceof Array && w.length > 1) {
              throw new Error(
                "Parse Error: multiple actions possible at state: " +
                  b +
                  ", token: " +
                  g
              );
            }
            switch (w[0]) {
              case 1:
                r.push(g);
                i.push(this.lexer.yytext);
                s.push(this.lexer.yylloc);
                r.push(w[1]);
                g = null;
                if (!y) {
                  f = this.lexer.yyleng;
                  u = this.lexer.yytext;
                  a = this.lexer.yylineno;
                  p = this.lexer.yylloc;
                  if (l > 0) l--;
                } else {
                  g = y;
                  y = null;
                }
                break;
              case 2:
                N = this.productions_[w[1]][1];
                x.$ = i[i.length - N];
                x._$ = {
                  first_line: s[s.length - (N || 1)].first_line,
                  last_line: s[s.length - 1].last_line,
                  first_column: s[s.length - (N || 1)].first_column,
                  last_column: s[s.length - 1].last_column,
                };
                if (d) {
                  x._$.range = [
                    s[s.length - (N || 1)].range[0],
                    s[s.length - 1].range[1],
                  ];
                }
                S = this.performAction.call(x, u, f, a, this.yy, w[1], i, s);
                if (typeof S !== "undefined") {
                  return S;
                }
                if (N) {
                  r = r.slice(0, -1 * N * 2);
                  i = i.slice(0, -1 * N);
                  s = s.slice(0, -1 * N);
                }
                r.push(this.productions_[w[1]][0]);
                i.push(x.$);
                s.push(x._$);
                C = o[r[r.length - 2]][r[r.length - 1]];
                r.push(C);
                break;
              case 3:
                return true;
            }
          }
          return true;
        },
      };
      var n = (function () {
        var e = {
          EOF: 1,
          parseError: function (t, n) {
            if (this.yy.parser) {
              this.yy.parser.parseError(t, n);
            } else {
              throw new Error(t);
            }
          },
          setInput: function (e) {
            this._input = e;
            this._more = this._less = this.done = false;
            this.yylineno = this.yyleng = 0;
            this.yytext = this.matched = this.match = "";
            this.conditionStack = ["INITIAL"];
            this.yylloc = {
              first_line: 1,
              first_column: 0,
              last_line: 1,
              last_column: 0,
            };
            if (this.options.ranges) this.yylloc.range = [0, 0];
            this.offset = 0;
            return this;
          },
          input: function () {
            var e = this._input[0];
            this.yytext += e;
            this.yyleng++;
            this.offset++;
            this.match += e;
            this.matched += e;
            var t = e.match(/(?:\r\n?|\n).*/g);
            if (t) {
              this.yylineno++;
              this.yylloc.last_line++;
            } else {
              this.yylloc.last_column++;
            }
            if (this.options.ranges) this.yylloc.range[1]++;
            this._input = this._input.slice(1);
            return e;
          },
          unput: function (e) {
            var t = e.length;
            var n = e.split(/(?:\r\n?|\n)/g);
            this._input = e + this._input;
            this.yytext = this.yytext.substr(0, this.yytext.length - t - 1);
            this.offset -= t;
            var r = this.match.split(/(?:\r\n?|\n)/g);
            this.match = this.match.substr(0, this.match.length - 1);
            this.matched = this.matched.substr(0, this.matched.length - 1);
            if (n.length - 1) this.yylineno -= n.length - 1;
            var i = this.yylloc.range;
            this.yylloc = {
              first_line: this.yylloc.first_line,
              last_line: this.yylineno + 1,
              first_column: this.yylloc.first_column,
              last_column: n
                ? (n.length === r.length ? this.yylloc.first_column : 0) +
                  r[r.length - n.length].length -
                  n[0].length
                : this.yylloc.first_column - t,
            };
            if (this.options.ranges) {
              this.yylloc.range = [i[0], i[0] + this.yyleng - t];
            }
            return this;
          },
          more: function () {
            this._more = true;
            return this;
          },
          less: function (e) {
            this.unput(this.match.slice(e));
          },
          pastInput: function () {
            var e = this.matched.substr(
              0,
              this.matched.length - this.match.length
            );
            return (
              (e.length > 20 ? "..." : "") + e.substr(-20).replace(/\n/g, "")
            );
          },
          upcomingInput: function () {
            var e = this.match;
            if (e.length < 20) {
              e += this._input.substr(0, 20 - e.length);
            }
            return (e.substr(0, 20) + (e.length > 20 ? "..." : "")).replace(
              /\n/g,
              ""
            );
          },
          showPosition: function () {
            var e = this.pastInput();
            var t = new Array(e.length + 1).join("-");
            return e + this.upcomingInput() + "\n" + t + "^";
          },
          next: function () {
            if (this.done) {
              return this.EOF;
            }
            if (!this._input) this.done = true;
            var e, t, n, r, i, s;
            if (!this._more) {
              this.yytext = "";
              this.match = "";
            }
            var o = this._currentRules();
            for (var u = 0; u < o.length; u++) {
              n = this._input.match(this.rules[o[u]]);
              if (n && (!t || n[0].length > t[0].length)) {
                t = n;
                r = u;
                if (!this.options.flex) break;
              }
            }
            if (t) {
              s = t[0].match(/(?:\r\n?|\n).*/g);
              if (s) this.yylineno += s.length;
              this.yylloc = {
                first_line: this.yylloc.last_line,
                last_line: this.yylineno + 1,
                first_column: this.yylloc.last_column,
                last_column: s
                  ? s[s.length - 1].length -
                    s[s.length - 1].match(/\r?\n?/)[0].length
                  : this.yylloc.last_column + t[0].length,
              };
              this.yytext += t[0];
              this.match += t[0];
              this.matches = t;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                this.yylloc.range = [this.offset, (this.offset += this.yyleng)];
              }
              this._more = false;
              this._input = this._input.slice(t[0].length);
              this.matched += t[0];
              e = this.performAction.call(
                this,
                this.yy,
                this,
                o[r],
                this.conditionStack[this.conditionStack.length - 1]
              );
              if (this.done && this._input) this.done = false;
              if (e) return e;
              else return;
            }
            if (this._input === "") {
              return this.EOF;
            } else {
              return this.parseError(
                "Lexical error on line " +
                  (this.yylineno + 1) +
                  ". Unrecognized text.\n" +
                  this.showPosition(),
                { text: "", token: null, line: this.yylineno }
              );
            }
          },
          lex: function () {
            var t = this.next();
            if (typeof t !== "undefined") {
              return t;
            } else {
              return this.lex();
            }
          },
          begin: function (t) {
            this.conditionStack.push(t);
          },
          popState: function () {
            return this.conditionStack.pop();
          },
          _currentRules: function () {
            return this.conditions[
              this.conditionStack[this.conditionStack.length - 1]
            ].rules;
          },
          topState: function () {
            return this.conditionStack[this.conditionStack.length - 2];
          },
          pushState: function (t) {
            this.begin(t);
          },
        };
        e.options = {};
        e.performAction = function (t, n, r, i) {
          function s(e, t) {
            return (n.yytext = n.yytext.substr(e, n.yyleng - t));
          }
          var o = i;
          switch (r) {
            case 0:
              if (n.yytext.slice(-2) === "\\\\") {
                s(0, 1);
                this.begin("mu");
              } else if (n.yytext.slice(-1) === "\\") {
                s(0, 1);
                this.begin("emu");
              } else {
                this.begin("mu");
              }
              if (n.yytext) return 14;
              break;
            case 1:
              return 14;
              break;
            case 2:
              this.popState();
              return 14;
              break;
            case 3:
              s(0, 4);
              this.popState();
              return 15;
              break;
            case 4:
              return 35;
              break;
            case 5:
              return 36;
              break;
            case 6:
              return 25;
              break;
            case 7:
              return 16;
              break;
            case 8:
              return 20;
              break;
            case 9:
              return 19;
              break;
            case 10:
              return 19;
              break;
            case 11:
              return 23;
              break;
            case 12:
              return 22;
              break;
            case 13:
              this.popState();
              this.begin("com");
              break;
            case 14:
              s(3, 5);
              this.popState();
              return 15;
              break;
            case 15:
              return 22;
              break;
            case 16:
              return 41;
              break;
            case 17:
              return 40;
              break;
            case 18:
              return 40;
              break;
            case 19:
              return 44;
              break;
            case 20:
              break;
            case 21:
              this.popState();
              return 24;
              break;
            case 22:
              this.popState();
              return 18;
              break;
            case 23:
              n.yytext = s(1, 2).replace(/\\"/g, '"');
              return 32;
              break;
            case 24:
              n.yytext = s(1, 2).replace(/\\'/g, "'");
              return 32;
              break;
            case 25:
              return 42;
              break;
            case 26:
              return 34;
              break;
            case 27:
              return 34;
              break;
            case 28:
              return 33;
              break;
            case 29:
              return 40;
              break;
            case 30:
              n.yytext = s(1, 2);
              return 40;
              break;
            case 31:
              return "INVALID";
              break;
            case 32:
              return 5;
              break;
          }
        };
        e.rules = [
          /^(?:[^\x00]*?(?=(\{\{)))/,
          /^(?:[^\x00]+)/,
          /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,
          /^(?:[\s\S]*?--\}\})/,
          /^(?:\()/,
          /^(?:\))/,
          /^(?:\{\{(~)?>)/,
          /^(?:\{\{(~)?#)/,
          /^(?:\{\{(~)?\/)/,
          /^(?:\{\{(~)?\^)/,
          /^(?:\{\{(~)?\s*else\b)/,
          /^(?:\{\{(~)?\{)/,
          /^(?:\{\{(~)?&)/,
          /^(?:\{\{!--)/,
          /^(?:\{\{![\s\S]*?\}\})/,
          /^(?:\{\{(~)?)/,
          /^(?:=)/,
          /^(?:\.\.)/,
          /^(?:\.(?=([=~}\s\/.)])))/,
          /^(?:[\/.])/,
          /^(?:\s+)/,
          /^(?:\}(~)?\}\})/,
          /^(?:(~)?\}\})/,
          /^(?:"(\\["]|[^"])*")/,
          /^(?:'(\\[']|[^'])*')/,
          /^(?:@)/,
          /^(?:true(?=([~}\s)])))/,
          /^(?:false(?=([~}\s)])))/,
          /^(?:-?[0-9]+(?=([~}\s)])))/,
          /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/,
          /^(?:\[[^\]]*\])/,
          /^(?:.)/,
          /^(?:$)/,
        ];
        e.conditions = {
          mu: {
            rules: [
              4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
              22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
            ],
            inclusive: false,
          },
          emu: { rules: [2], inclusive: false },
          com: { rules: [3], inclusive: false },
          INITIAL: { rules: [0, 1, 32], inclusive: true },
        };
        return e;
      })();
      e.lexer = n;
      r.prototype = e;
      e.Parser = r;
      return new r();
    })();
    e = t;
    return e;
  })();
  var a = (function (e, t) {
    "use strict";
    function s(e) {
      if (e.constructor === i.ProgramNode) {
        return e;
      }
      r.yy = i;
      return r.parse(e);
    }
    var n = {};
    var r = e;
    var i = t;
    n.parser = r;
    n.parse = s;
    return n;
  })(u, o);
  var f = (function (e) {
    "use strict";
    function r() {}
    function i(e, t, r) {
      if (
        e == null ||
        (typeof e !== "string" && e.constructor !== r.AST.ProgramNode)
      ) {
        throw new n(
          "You must pass a string or Handlebars AST to Handlebars.precompile. You passed " +
            e
        );
      }
      t = t || {};
      if (!("data" in t)) {
        t.data = true;
      }
      var i = r.parse(e);
      var s = new r.Compiler().compile(i, t);
      return new r.JavaScriptCompiler().compile(s, t);
    }
    function s(e, t, r) {
      function s() {
        var n = r.parse(e);
        var i = new r.Compiler().compile(n, t);
        var s = new r.JavaScriptCompiler().compile(i, t, undefined, true);
        return r.template(s);
      }
      if (
        e == null ||
        (typeof e !== "string" && e.constructor !== r.AST.ProgramNode)
      ) {
        throw new n(
          "You must pass a string or Handlebars AST to Handlebars.compile. You passed " +
            e
        );
      }
      t = t || {};
      if (!("data" in t)) {
        t.data = true;
      }
      var i;
      return function (e, t) {
        if (!i) {
          i = s();
        }
        return i.call(this, e, t);
      };
    }
    var t = {};
    var n = e;
    t.Compiler = r;
    r.prototype = {
      compiler: r,
      disassemble: function () {
        var e = this.opcodes,
          t,
          n = [],
          r,
          i;
        for (var s = 0, o = e.length; s < o; s++) {
          t = e[s];
          if (t.opcode === "DECLARE") {
            n.push("DECLARE " + t.name + "=" + t.value);
          } else {
            r = [];
            for (var u = 0; u < t.args.length; u++) {
              i = t.args[u];
              if (typeof i === "string") {
                i = '"' + i.replace("\n", "\\n") + '"';
              }
              r.push(i);
            }
            n.push(t.opcode + " " + r.join(" "));
          }
        }
        return n.join("\n");
      },
      equals: function (e) {
        var t = this.opcodes.length;
        if (e.opcodes.length !== t) {
          return false;
        }
        for (var n = 0; n < t; n++) {
          var r = this.opcodes[n],
            i = e.opcodes[n];
          if (r.opcode !== i.opcode || r.args.length !== i.args.length) {
            return false;
          }
          for (var s = 0; s < r.args.length; s++) {
            if (r.args[s] !== i.args[s]) {
              return false;
            }
          }
        }
        t = this.children.length;
        if (e.children.length !== t) {
          return false;
        }
        for (n = 0; n < t; n++) {
          if (!this.children[n].equals(e.children[n])) {
            return false;
          }
        }
        return true;
      },
      guid: 0,
      compile: function (e, t) {
        this.opcodes = [];
        this.children = [];
        this.depths = { list: [] };
        this.options = t;
        var n = this.options.knownHelpers;
        this.options.knownHelpers = {
          helperMissing: true,
          blockHelperMissing: true,
          each: true,
          if: true,
          unless: true,
          with: true,
          log: true,
        };
        if (n) {
          for (var r in n) {
            this.options.knownHelpers[r] = n[r];
          }
        }
        return this.accept(e);
      },
      accept: function (e) {
        var t = e.strip || {},
          n;
        if (t.left) {
          this.opcode("strip");
        }
        n = this[e.type](e);
        if (t.right) {
          this.opcode("strip");
        }
        return n;
      },
      program: function (e) {
        var t = e.statements;
        for (var n = 0, r = t.length; n < r; n++) {
          this.accept(t[n]);
        }
        this.isSimple = r === 1;
        this.depths.list = this.depths.list.sort(function (e, t) {
          return e - t;
        });
        return this;
      },
      compileProgram: function (e) {
        var t = new this.compiler().compile(e, this.options);
        var n = this.guid++,
          r;
        this.usePartial = this.usePartial || t.usePartial;
        this.children[n] = t;
        for (var i = 0, s = t.depths.list.length; i < s; i++) {
          r = t.depths.list[i];
          if (r < 2) {
            continue;
          } else {
            this.addDepth(r - 1);
          }
        }
        return n;
      },
      block: function (e) {
        var t = e.mustache,
          n = e.program,
          r = e.inverse;
        if (n) {
          n = this.compileProgram(n);
        }
        if (r) {
          r = this.compileProgram(r);
        }
        var i = t.sexpr;
        var s = this.classifySexpr(i);
        if (s === "helper") {
          this.helperSexpr(i, n, r);
        } else if (s === "simple") {
          this.simpleSexpr(i);
          this.opcode("pushProgram", n);
          this.opcode("pushProgram", r);
          this.opcode("emptyHash");
          this.opcode("blockValue");
        } else {
          this.ambiguousSexpr(i, n, r);
          this.opcode("pushProgram", n);
          this.opcode("pushProgram", r);
          this.opcode("emptyHash");
          this.opcode("ambiguousBlockValue");
        }
        this.opcode("append");
      },
      hash: function (e) {
        var t = e.pairs,
          n,
          r;
        this.opcode("pushHash");
        for (var i = 0, s = t.length; i < s; i++) {
          n = t[i];
          r = n[1];
          if (this.options.stringParams) {
            if (r.depth) {
              this.addDepth(r.depth);
            }
            this.opcode("getContext", r.depth || 0);
            this.opcode("pushStringParam", r.stringModeValue, r.type);
            if (r.type === "sexpr") {
              this.sexpr(r);
            }
          } else {
            this.accept(r);
          }
          this.opcode("assignToHash", n[0]);
        }
        this.opcode("popHash");
      },
      partial: function (e) {
        var t = e.partialName;
        this.usePartial = true;
        if (e.context) {
          this.ID(e.context);
        } else {
          this.opcode("push", "depth0");
        }
        this.opcode("invokePartial", t.name);
        this.opcode("append");
      },
      content: function (e) {
        this.opcode("appendContent", e.string);
      },
      mustache: function (e) {
        this.sexpr(e.sexpr);
        if (e.escaped && !this.options.noEscape) {
          this.opcode("appendEscaped");
        } else {
          this.opcode("append");
        }
      },
      ambiguousSexpr: function (e, t, n) {
        var r = e.id,
          i = r.parts[0],
          s = t != null || n != null;
        this.opcode("getContext", r.depth);
        this.opcode("pushProgram", t);
        this.opcode("pushProgram", n);
        this.opcode("invokeAmbiguous", i, s);
      },
      simpleSexpr: function (e) {
        var t = e.id;
        if (t.type === "DATA") {
          this.DATA(t);
        } else if (t.parts.length) {
          this.ID(t);
        } else {
          this.addDepth(t.depth);
          this.opcode("getContext", t.depth);
          this.opcode("pushContext");
        }
        this.opcode("resolvePossibleLambda");
      },
      helperSexpr: function (e, t, r) {
        var i = this.setupFullMustacheParams(e, t, r),
          s = e.id.parts[0];
        if (this.options.knownHelpers[s]) {
          this.opcode("invokeKnownHelper", i.length, s);
        } else if (this.options.knownHelpersOnly) {
          throw new n(
            "You specified knownHelpersOnly, but used the unknown helper " + s,
            e
          );
        } else {
          this.opcode("invokeHelper", i.length, s, e.isRoot);
        }
      },
      sexpr: function (e) {
        var t = this.classifySexpr(e);
        if (t === "simple") {
          this.simpleSexpr(e);
        } else if (t === "helper") {
          this.helperSexpr(e);
        } else {
          this.ambiguousSexpr(e);
        }
      },
      ID: function (e) {
        this.addDepth(e.depth);
        this.opcode("getContext", e.depth);
        var t = e.parts[0];
        if (!t) {
          this.opcode("pushContext");
        } else {
          this.opcode("lookupOnContext", e.parts[0]);
        }
        for (var n = 1, r = e.parts.length; n < r; n++) {
          this.opcode("lookup", e.parts[n]);
        }
      },
      DATA: function (e) {
        this.options.data = true;
        if (e.id.isScoped || e.id.depth) {
          throw new n(
            "Scoped data references are not supported: " + e.original,
            e
          );
        }
        this.opcode("lookupData");
        var t = e.id.parts;
        for (var r = 0, i = t.length; r < i; r++) {
          this.opcode("lookup", t[r]);
        }
      },
      STRING: function (e) {
        this.opcode("pushString", e.string);
      },
      INTEGER: function (e) {
        this.opcode("pushLiteral", e.integer);
      },
      BOOLEAN: function (e) {
        this.opcode("pushLiteral", e.bool);
      },
      comment: function () {},
      opcode: function (e) {
        this.opcodes.push({ opcode: e, args: [].slice.call(arguments, 1) });
      },
      declare: function (e, t) {
        this.opcodes.push({ opcode: "DECLARE", name: e, value: t });
      },
      addDepth: function (e) {
        if (e === 0) {
          return;
        }
        if (!this.depths[e]) {
          this.depths[e] = true;
          this.depths.list.push(e);
        }
      },
      classifySexpr: function (e) {
        var t = e.isHelper;
        var n = e.eligibleHelper;
        var r = this.options;
        if (n && !t) {
          var i = e.id.parts[0];
          if (r.knownHelpers[i]) {
            t = true;
          } else if (r.knownHelpersOnly) {
            n = false;
          }
        }
        if (t) {
          return "helper";
        } else if (n) {
          return "ambiguous";
        } else {
          return "simple";
        }
      },
      pushParams: function (e) {
        var t = e.length,
          n;
        while (t--) {
          n = e[t];
          if (this.options.stringParams) {
            if (n.depth) {
              this.addDepth(n.depth);
            }
            this.opcode("getContext", n.depth || 0);
            this.opcode("pushStringParam", n.stringModeValue, n.type);
            if (n.type === "sexpr") {
              this.sexpr(n);
            }
          } else {
            this[n.type](n);
          }
        }
      },
      setupFullMustacheParams: function (e, t, n) {
        var r = e.params;
        this.pushParams(r);
        this.opcode("pushProgram", t);
        this.opcode("pushProgram", n);
        if (e.hash) {
          this.hash(e.hash);
        } else {
          this.opcode("emptyHash");
        }
        return r;
      },
    };
    t.precompile = i;
    t.compile = s;
    return t;
  })(n);
  var l = (function (e, t) {
    "use strict";
    function u(e) {
      this.value = e;
    }
    function a() {}
    var n;
    var r = e.COMPILER_REVISION;
    var i = e.REVISION_CHANGES;
    var s = e.log;
    var o = t;
    a.prototype = {
      nameLookup: function (e, t) {
        var n, r;
        if (e.indexOf("depth") === 0) {
          n = true;
        }
        if (/^[0-9]+$/.test(t)) {
          r = e + "[" + t + "]";
        } else if (a.isValidJavaScriptVariableName(t)) {
          r = e + "." + t;
        } else {
          r = e + "['" + t + "']";
        }
        if (n) {
          return "(" + e + " && " + r + ")";
        } else {
          return r;
        }
      },
      compilerInfo: function () {
        var e = r,
          t = i[e];
        return "this.compilerInfo = [" + e + ",'" + t + "'];\n";
      },
      appendToBuffer: function (e) {
        if (this.environment.isSimple) {
          return "return " + e + ";";
        } else {
          return {
            appendToBuffer: true,
            content: e,
            toString: function () {
              return "buffer += " + e + ";";
            },
          };
        }
      },
      initializeBuffer: function () {
        return this.quotedString("");
      },
      namespace: "Handlebars",
      compile: function (e, t, n, r) {
        this.environment = e;
        this.options = t || {};
        s("debug", this.environment.disassemble() + "\n\n");
        this.name = this.environment.name;
        this.isChild = !!n;
        this.context = n || { programs: [], environments: [], aliases: {} };
        this.preamble();
        this.stackSlot = 0;
        this.stackVars = [];
        this.registers = { list: [] };
        this.hashes = [];
        this.compileStack = [];
        this.inlineStack = [];
        this.compileChildren(e, t);
        var i = e.opcodes,
          u;
        this.i = 0;
        for (var a = i.length; this.i < a; this.i++) {
          u = i[this.i];
          if (u.opcode === "DECLARE") {
            this[u.name] = u.value;
          } else {
            this[u.opcode].apply(this, u.args);
          }
          if (u.opcode !== this.stripNext) {
            this.stripNext = false;
          }
        }
        this.pushSource("");
        if (
          this.stackSlot ||
          this.inlineStack.length ||
          this.compileStack.length
        ) {
          throw new o("Compile completed with content left on stack");
        }
        return this.createFunctionContext(r);
      },
      preamble: function () {
        var e = [];
        if (!this.isChild) {
          var t = this.namespace;
          var n = "helpers = this.merge(helpers, " + t + ".helpers);";
          if (this.environment.usePartial) {
            n = n + " partials = this.merge(partials, " + t + ".partials);";
          }
          if (this.options.data) {
            n = n + " data = data || {};";
          }
          e.push(n);
        } else {
          e.push("");
        }
        if (!this.environment.isSimple) {
          e.push(", buffer = " + this.initializeBuffer());
        } else {
          e.push("");
        }
        this.lastContext = 0;
        this.source = e;
      },
      createFunctionContext: function (e) {
        var t = this.stackVars.concat(this.registers.list);
        if (t.length > 0) {
          this.source[1] = this.source[1] + ", " + t.join(", ");
        }
        if (!this.isChild) {
          for (var n in this.context.aliases) {
            if (this.context.aliases.hasOwnProperty(n)) {
              this.source[1] =
                this.source[1] + ", " + n + "=" + this.context.aliases[n];
            }
          }
        }
        if (this.source[1]) {
          this.source[1] = "var " + this.source[1].substring(2) + ";";
        }
        if (!this.isChild) {
          this.source[1] += "\n" + this.context.programs.join("\n") + "\n";
        }
        if (!this.environment.isSimple) {
          this.pushSource("return buffer;");
        }
        var r = this.isChild
          ? ["depth0", "data"]
          : ["Handlebars", "depth0", "helpers", "partials", "data"];
        for (var i = 0, o = this.environment.depths.list.length; i < o; i++) {
          r.push("depth" + this.environment.depths.list[i]);
        }
        var u = this.mergeSource();
        if (!this.isChild) {
          u = this.compilerInfo() + u;
        }
        if (e) {
          r.push(u);
          return Function.apply(this, r);
        } else {
          var a =
            "function " +
            (this.name || "") +
            "(" +
            r.join(",") +
            ") {\n  " +
            u +
            "}";
          s("debug", a + "\n\n");
          return a;
        }
      },
      mergeSource: function () {
        var e = "",
          t;
        for (var n = 0, r = this.source.length; n < r; n++) {
          var i = this.source[n];
          if (i.appendToBuffer) {
            if (t) {
              t = t + "\n    + " + i.content;
            } else {
              t = i.content;
            }
          } else {
            if (t) {
              e += "buffer += " + t + ";\n  ";
              t = undefined;
            }
            e += i + "\n  ";
          }
        }
        return e;
      },
      blockValue: function () {
        this.context.aliases.blockHelperMissing = "helpers.blockHelperMissing";
        var e = ["depth0"];
        this.setupParams(0, e);
        this.replaceStack(function (t) {
          e.splice(1, 0, t);
          return "blockHelperMissing.call(" + e.join(", ") + ")";
        });
      },
      ambiguousBlockValue: function () {
        this.context.aliases.blockHelperMissing = "helpers.blockHelperMissing";
        var e = ["depth0"];
        this.setupParams(0, e);
        var t = this.topStack();
        e.splice(1, 0, t);
        this.pushSource(
          "if (!" +
            this.lastHelper +
            ") { " +
            t +
            " = blockHelperMissing.call(" +
            e.join(", ") +
            "); }"
        );
      },
      appendContent: function (e) {
        if (this.pendingContent) {
          e = this.pendingContent + e;
        }
        if (this.stripNext) {
          e = e.replace(/^\s+/, "");
        }
        this.pendingContent = e;
      },
      strip: function () {
        if (this.pendingContent) {
          this.pendingContent = this.pendingContent.replace(/\s+$/, "");
        }
        this.stripNext = "strip";
      },
      append: function () {
        this.flushInline();
        var e = this.popStack();
        this.pushSource(
          "if(" + e + " || " + e + " === 0) { " + this.appendToBuffer(e) + " }"
        );
        if (this.environment.isSimple) {
          this.pushSource("else { " + this.appendToBuffer("''") + " }");
        }
      },
      appendEscaped: function () {
        this.context.aliases.escapeExpression = "this.escapeExpression";
        this.pushSource(
          this.appendToBuffer("escapeExpression(" + this.popStack() + ")")
        );
      },
      getContext: function (e) {
        if (this.lastContext !== e) {
          this.lastContext = e;
        }
      },
      lookupOnContext: function (e) {
        this.push(this.nameLookup("depth" + this.lastContext, e, "context"));
      },
      pushContext: function () {
        this.pushStackLiteral("depth" + this.lastContext);
      },
      resolvePossibleLambda: function () {
        this.context.aliases.functionType = '"function"';
        this.replaceStack(function (e) {
          return (
            "typeof " + e + " === functionType ? " + e + ".apply(depth0) : " + e
          );
        });
      },
      lookup: function (e) {
        this.replaceStack(function (t) {
          return (
            t +
            " == null || " +
            t +
            " === false ? " +
            t +
            " : " +
            this.nameLookup(t, e, "context")
          );
        });
      },
      lookupData: function () {
        this.pushStackLiteral("data");
      },
      pushStringParam: function (e, t) {
        this.pushStackLiteral("depth" + this.lastContext);
        this.pushString(t);
        if (t !== "sexpr") {
          if (typeof e === "string") {
            this.pushString(e);
          } else {
            this.pushStackLiteral(e);
          }
        }
      },
      emptyHash: function () {
        this.pushStackLiteral("{}");
        if (this.options.stringParams) {
          this.push("{}");
          this.push("{}");
        }
      },
      pushHash: function () {
        if (this.hash) {
          this.hashes.push(this.hash);
        }
        this.hash = { values: [], types: [], contexts: [] };
      },
      popHash: function () {
        var e = this.hash;
        this.hash = this.hashes.pop();
        if (this.options.stringParams) {
          this.push("{" + e.contexts.join(",") + "}");
          this.push("{" + e.types.join(",") + "}");
        }
        this.push("{\n    " + e.values.join(",\n    ") + "\n  }");
      },
      pushString: function (e) {
        this.pushStackLiteral(this.quotedString(e));
      },
      push: function (e) {
        this.inlineStack.push(e);
        return e;
      },
      pushLiteral: function (e) {
        this.pushStackLiteral(e);
      },
      pushProgram: function (e) {
        if (e != null) {
          this.pushStackLiteral(this.programExpression(e));
        } else {
          this.pushStackLiteral(null);
        }
      },
      invokeHelper: function (e, t, n) {
        this.context.aliases.helperMissing = "helpers.helperMissing";
        this.useRegister("helper");
        var r = (this.lastHelper = this.setupHelper(e, t, true));
        var i = this.nameLookup("depth" + this.lastContext, t, "context");
        var s = "helper = " + r.name + " || " + i;
        if (r.paramsInit) {
          s += "," + r.paramsInit;
        }
        this.push(
          "(" +
            s +
            ",helper " +
            "? helper.call(" +
            r.callParams +
            ") " +
            ": helperMissing.call(" +
            r.helperMissingParams +
            "))"
        );
        if (!n) {
          this.flushInline();
        }
      },
      invokeKnownHelper: function (e, t) {
        var n = this.setupHelper(e, t);
        this.push(n.name + ".call(" + n.callParams + ")");
      },
      invokeAmbiguous: function (e, t) {
        this.context.aliases.functionType = '"function"';
        this.useRegister("helper");
        this.emptyHash();
        var n = this.setupHelper(0, e, t);
        var r = (this.lastHelper = this.nameLookup("helpers", e, "helper"));
        var i = this.nameLookup("depth" + this.lastContext, e, "context");
        var s = this.nextStack();
        if (n.paramsInit) {
          this.pushSource(n.paramsInit);
        }
        this.pushSource(
          "if (helper = " +
            r +
            ") { " +
            s +
            " = helper.call(" +
            n.callParams +
            "); }"
        );
        this.pushSource(
          "else { helper = " +
            i +
            "; " +
            s +
            " = typeof helper === functionType ? helper.call(" +
            n.callParams +
            ") : helper; }"
        );
      },
      invokePartial: function (e) {
        var t = [
          this.nameLookup("partials", e, "partial"),
          "'" + e + "'",
          this.popStack(),
          "helpers",
          "partials",
        ];
        if (this.options.data) {
          t.push("data");
        }
        this.context.aliases.self = "this";
        this.push("self.invokePartial(" + t.join(", ") + ")");
      },
      assignToHash: function (e) {
        var t = this.popStack(),
          n,
          r;
        if (this.options.stringParams) {
          r = this.popStack();
          n = this.popStack();
        }
        var i = this.hash;
        if (n) {
          i.contexts.push("'" + e + "': " + n);
        }
        if (r) {
          i.types.push("'" + e + "': " + r);
        }
        i.values.push("'" + e + "': (" + t + ")");
      },
      compiler: a,
      compileChildren: function (e, t) {
        var n = e.children,
          r,
          i;
        for (var s = 0, o = n.length; s < o; s++) {
          r = n[s];
          i = new this.compiler();
          var u = this.matchExistingProgram(r);
          if (u == null) {
            this.context.programs.push("");
            u = this.context.programs.length;
            r.index = u;
            r.name = "program" + u;
            this.context.programs[u] = i.compile(r, t, this.context);
            this.context.environments[u] = r;
          } else {
            r.index = u;
            r.name = "program" + u;
          }
        }
      },
      matchExistingProgram: function (e) {
        for (var t = 0, n = this.context.environments.length; t < n; t++) {
          var r = this.context.environments[t];
          if (r && r.equals(e)) {
            return t;
          }
        }
      },
      programExpression: function (e) {
        this.context.aliases.self = "this";
        if (e == null) {
          return "self.noop";
        }
        var t = this.environment.children[e],
          n = t.depths.list,
          r;
        var i = [t.index, t.name, "data"];
        for (var s = 0, o = n.length; s < o; s++) {
          r = n[s];
          if (r === 1) {
            i.push("depth0");
          } else {
            i.push("depth" + (r - 1));
          }
        }
        return (
          (n.length === 0 ? "self.program(" : "self.programWithDepth(") +
          i.join(", ") +
          ")"
        );
      },
      register: function (e, t) {
        this.useRegister(e);
        this.pushSource(e + " = " + t + ";");
      },
      useRegister: function (e) {
        if (!this.registers[e]) {
          this.registers[e] = true;
          this.registers.list.push(e);
        }
      },
      pushStackLiteral: function (e) {
        return this.push(new u(e));
      },
      pushSource: function (e) {
        if (this.pendingContent) {
          this.source.push(
            this.appendToBuffer(this.quotedString(this.pendingContent))
          );
          this.pendingContent = undefined;
        }
        if (e) {
          this.source.push(e);
        }
      },
      pushStack: function (e) {
        this.flushInline();
        var t = this.incrStack();
        if (e) {
          this.pushSource(t + " = " + e + ";");
        }
        this.compileStack.push(t);
        return t;
      },
      replaceStack: function (e) {
        var t = "",
          n = this.isInline(),
          r,
          i,
          s;
        if (n) {
          var o = this.popStack(true);
          if (o instanceof u) {
            r = o.value;
            s = true;
          } else {
            i = !this.stackSlot;
            var a = !i ? this.topStackName() : this.incrStack();
            t = "(" + this.push(a) + " = " + o + "),";
            r = this.topStack();
          }
        } else {
          r = this.topStack();
        }
        var f = e.call(this, r);
        if (n) {
          if (!s) {
            this.popStack();
          }
          if (i) {
            this.stackSlot--;
          }
          this.push("(" + t + f + ")");
        } else {
          if (!/^stack/.test(r)) {
            r = this.nextStack();
          }
          this.pushSource(r + " = (" + t + f + ");");
        }
        return r;
      },
      nextStack: function () {
        return this.pushStack();
      },
      incrStack: function () {
        this.stackSlot++;
        if (this.stackSlot > this.stackVars.length) {
          this.stackVars.push("stack" + this.stackSlot);
        }
        return this.topStackName();
      },
      topStackName: function () {
        return "stack" + this.stackSlot;
      },
      flushInline: function () {
        var e = this.inlineStack;
        if (e.length) {
          this.inlineStack = [];
          for (var t = 0, n = e.length; t < n; t++) {
            var r = e[t];
            if (r instanceof u) {
              this.compileStack.push(r);
            } else {
              this.pushStack(r);
            }
          }
        }
      },
      isInline: function () {
        return this.inlineStack.length;
      },
      popStack: function (e) {
        var t = this.isInline(),
          n = (t ? this.inlineStack : this.compileStack).pop();
        if (!e && n instanceof u) {
          return n.value;
        } else {
          if (!t) {
            if (!this.stackSlot) {
              throw new o("Invalid stack pop");
            }
            this.stackSlot--;
          }
          return n;
        }
      },
      topStack: function (e) {
        var t = this.isInline() ? this.inlineStack : this.compileStack,
          n = t[t.length - 1];
        if (!e && n instanceof u) {
          return n.value;
        } else {
          return n;
        }
      },
      quotedString: function (e) {
        return (
          '"' +
          e
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029") +
          '"'
        );
      },
      setupHelper: function (e, t, n) {
        var r = [],
          i = this.setupParams(e, r, n);
        var s = this.nameLookup("helpers", t, "helper");
        return {
          params: r,
          paramsInit: i,
          name: s,
          callParams: ["depth0"].concat(r).join(", "),
          helperMissingParams:
            n && ["depth0", this.quotedString(t)].concat(r).join(", "),
        };
      },
      setupOptions: function (e, t) {
        var n = [],
          r = [],
          i = [],
          s,
          o,
          u;
        n.push("hash:" + this.popStack());
        if (this.options.stringParams) {
          n.push("hashTypes:" + this.popStack());
          n.push("hashContexts:" + this.popStack());
        }
        o = this.popStack();
        u = this.popStack();
        if (u || o) {
          if (!u) {
            this.context.aliases.self = "this";
            u = "self.noop";
          }
          if (!o) {
            this.context.aliases.self = "this";
            o = "self.noop";
          }
          n.push("inverse:" + o);
          n.push("fn:" + u);
        }
        for (var a = 0; a < e; a++) {
          s = this.popStack();
          t.push(s);
          if (this.options.stringParams) {
            i.push(this.popStack());
            r.push(this.popStack());
          }
        }
        if (this.options.stringParams) {
          n.push("contexts:[" + r.join(",") + "]");
          n.push("types:[" + i.join(",") + "]");
        }
        if (this.options.data) {
          n.push("data:data");
        }
        return n;
      },
      setupParams: function (e, t, n) {
        var r = "{" + this.setupOptions(e, t).join(",") + "}";
        if (n) {
          this.useRegister("options");
          t.push("options");
          return "options=" + r;
        } else {
          t.push(r);
          return "";
        }
      },
    };
    var f = (
      "break else new var" +
      " case finally return void" +
      " catch for switch while" +
      " continue function this with" +
      " default if throw" +
      " delete in try" +
      " do instanceof typeof" +
      " abstract enum int short" +
      " boolean export interface static" +
      " byte extends long super" +
      " char final native synchronized" +
      " class float package throws" +
      " const goto private transient" +
      " debugger implements protected volatile" +
      " double import public let yield"
    ).split(" ");
    var l = (a.RESERVED_WORDS = {});
    for (var c = 0, h = f.length; c < h; c++) {
      l[f[c]] = true;
    }
    a.isValidJavaScriptVariableName = function (e) {
      if (!a.RESERVED_WORDS[e] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(e)) {
        return true;
      }
      return false;
    };
    n = a;
    return n;
  })(r, n);
  var c = (function (e, t, n, r, i) {
    "use strict";
    var s;
    var o = e;
    var u = t;
    var a = n.parser;
    var f = n.parse;
    var l = r.Compiler;
    var c = r.compile;
    var h = r.precompile;
    var p = i;
    var d = o.create;
    var v = function () {
      var e = d();
      e.compile = function (t, n) {
        return c(t, n, e);
      };
      e.precompile = function (t, n) {
        return h(t, n, e);
      };
      e.AST = u;
      e.Compiler = l;
      e.JavaScriptCompiler = p;
      e.Parser = a;
      e.parse = f;
      return e;
    };
    o = v();
    o.create = v;
    s = o;
    return s;
  })(s, o, a, f, l);
  return c;
})();

if (typeof ShopifyAPI === "undefined") {
  ShopifyAPI = {};
}

/*============================================================================
  API Helper Functions
==============================================================================*/
function attributeToString(attribute) {
  if (typeof attribute !== "string") {
    attribute += "";
    if (attribute === "undefined") {
      attribute = "";
    }
  }
  return jQuery.trim(attribute);
}

/*============================================================================
  API Functions
==============================================================================*/
ShopifyAPI.onCartUpdate = function () {
  // alert('There are now ' + cart.item_count + ' items in the cart.');
};

ShopifyAPI.updateCartNote = function (note, callback) {
  var params = {
    type: "POST",
    url: "/cart/update.js",
    data: "note=" + attributeToString(note),
    dataType: "json",
    success: function (cart) {
      if (typeof callback === "function") {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
    },
    error: function (XMLHttpRequest, textStatus) {
      ShopifyAPI.onError(XMLHttpRequest, textStatus);
    },
  };
  jQuery.ajax(params);
};

ShopifyAPI.updateDiscountData = function (
  discountCode,
  callback,
  errorCallback
) {
  if (discountCode === undefined) {
    return;
  }
  var query = new URLSearchParams({
    discount: discountCode,
  });
  var $body = $("body");
  $body.addClass("drawer--is-loading");
  return fetch("/checkout?".concat(query))
    .then(function (response) {
      return response.text();
    })
    .then(function (html) {
      var parser = new DOMParser();
      var newDoc = parser.parseFromString(html, "text/html");
      var $ = newDoc.querySelector.bind(newDoc);
      var discountType = $(".total-line.total-line--reduction");
      discountType =
        discountType &&
        discountType.dataset &&
        discountType.dataset.discountType;
      var CDAT = $(
        "tr.total-line--reduction td.total-line__price .order-summary__emphasis"
      );

      CDAT = CDAT && CDAT.dataset && CDAT.dataset.checkoutDiscountAmountTarget;
      var CPDT = $(".payment-due__price");
      CPDT = CPDT && CPDT.dataset && CPDT.dataset.checkoutPaymentDueTarget;
      var totalText = $(".payment-due-label__total");
      totalText = (totalText && totalText.innerText) || "Total";
      var discountText = $(".total-line__name span");
      discountText = (discountText && discountText.innerText) || "Discount";

      var error = $("#error-for-reduction_code");
      if (error != null) {
        return {
          discountType: "error",
          checkoutDiscountAmountTarget: 0,
          checkoutPaymentDueTarget: 0,
          discountText: "error",
          totalText: "error",
        };
      }
      return {
        discountType: discountType,
        checkoutDiscountAmountTarget: CDAT,
        checkoutPaymentDueTarget: CPDT,
        discountText: discountText,
        totalText: totalText,
      };
    })
    .then((response) => {
      // console.log('updateDiscountData',response);
      if (response && response.hasOwnProperty("discountType")) {
        if (response.discountType === "error") {
          errorCallback();
        } else if (
          response.discountType === "percentage" ||
          response.discountType === "fixed_amount"
        ) {
          response.discountCode = discountCode;
          ShopifyAPI.saveFeeturesData("feetures_cart_coupon", response);
          callback();
        } else {
          errorCallback();
        }
      } else {
        errorCallback();
      }
    })
    .catch(() => {
      errorCallback();
    });
};

ShopifyAPI.saveFeeturesData = function (key, value) {
  const parsed = JSON.stringify(value);
  localStorage.setItem(key, parsed);
};

ShopifyAPI.getFeeturesData = function (key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    localStorage.removeItem(key);
  }
};

ShopifyAPI.removeFeeturesData = function (key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

ShopifyAPI.onError = function (XMLHttpRequest) {
  var data = eval("(" + XMLHttpRequest.responseText + ")");
  if (data.message) {
    alert(data.message + "(" + data.status + "): " + data.description);
  }
};

/*============================================================================
  POST to cart/add.js returns the JSON of the cart
    - Allow use of form element instead of just id
    - Allow custom error callback
==============================================================================*/
ShopifyAPI.addItemFromForm = function (form, callback, errorCallback) {
  var formData = new FormData(form);
  var params = {
    type: "POST",
    url: "/cart/add.js",
    data: formData,
    processData: false,
    contentType: false,
    dataType: "json",
    success: function (line_item) {
      if (typeof callback === "function") {
        callback(line_item, form);
      } else {
        ShopifyAPI.onItemAdded(line_item, form);
      }
    },
    error: function (XMLHttpRequest, textStatus) {
      if (typeof errorCallback === "function") {
        errorCallback(XMLHttpRequest, textStatus);
      } else {
        ShopifyAPI.onError(XMLHttpRequest, textStatus);
      }
    },
  };
  jQuery.ajax(params);
};

// Get from cart.js returns the cart in JSON
ShopifyAPI.getCart = function (callback) {
  jQuery.getJSON("/cart.js", function (cart) {
    if (typeof callback === "function") {
      callback(cart);
    } else {
      ShopifyAPI.onCartUpdate(cart);
    }
  });
};

// POST to cart/change.js returns the cart in JSON
ShopifyAPI.changeItem = function (line, quantity, callback) {
  var params = {
    type: "POST",
    url: "/cart/change.js",
    data: "quantity=" + quantity + "&line=" + line,
    dataType: "json",
    success: function (cart) {
      if (typeof callback === "function") {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
    },
    error: function (XMLHttpRequest, textStatus) {
      ShopifyAPI.onError(XMLHttpRequest, textStatus);
    },
  };
  jQuery.ajax(params);
};

/*============================================================================
  Ajax Shopify Add To Cart
==============================================================================*/
var ajaxCart = (function (module, $) {
  "use strict";

  // Public functions
  var init, loadCart;

  // Private general variables
  var settings, isUpdating, $body, $ajaxCartCoupon;

  // Private plugin variables
  var $formContainer,
    $addToCart,
    $cartCountSelector,
    $cartCostSelector,
    $cartContainer,
    $couponCodeButton;

  // Private functions
  var updateCountPrice,
    formOverride,
    itemAddedCallback,
    itemErrorCallback,
    cartUpdateCallback,
    buildCart,
    cartCallback,
    adjustCart,
    adjustCartCallback,
    couponFieldErrorCallback,
    qtySelectors,
    validateQty;

  /*============================================================================
    Initialise the plugin and define global options
  ==============================================================================*/
  init = function (options) {
    // Default settings
    settings = {
      formSelector: "[data-product-form]",
      cartContainer: "#CartContainer",
      addToCartSelector: 'input[type="submit"]',
      cartCountSelector: null,
      cartCostSelector: null,
      moneyFormat: "$",
      disableAjaxCart: false,
      enableQtySelectors: true,
      couponCodeButton: ".coupon-code-button",
    };

    // Override defaults with arguments
    $.extend(settings, options);

    // Select DOM elements
    $formContainer = $(settings.formSelector);
    $cartContainer = $(settings.cartContainer);
    $addToCart = $formContainer.find(settings.addToCartSelector);
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector = $(settings.cartCostSelector);
    $couponCodeButton = $(settings.couponCodeButton);

    // General Selectors
    $body = $("body");
    $ajaxCartCoupon = $(".ajax-cart-coupon");

    // Track cart activity status
    isUpdating = false;

    // Setup ajax quantity selectors on the any template if enableQtySelectors is true
    if (settings.enableQtySelectors) {
      qtySelectors();
    }

    // Take over the add to cart form submit action if ajax enabled
    if (!settings.disableAjaxCart && $addToCart.length) {
      formOverride();
    }

    // Run this function in case we're using the quantity selector outside of the cart
    adjustCart();
  };

  loadCart = function () {
    $body.addClass("drawer--is-loading");
    ShopifyAPI.getCart(cartUpdateCallback);
  };

  updateCountPrice = function (cart) {
    if ($cartCountSelector) {
      $cartCountSelector.html(cart.item_count).removeClass("hidden-count");

      if (cart.item_count === 0) {
        $cartCountSelector.addClass("hidden-count");
      }
    }
    if ($cartCostSelector) {
      $cartCostSelector.html(
        theme.Currency.formatMoney(cart.total_price, settings.moneyFormat)
      );
    }
  };

  formOverride = function () {
    $formContainer.on("submit", function (evt) {
      evt.preventDefault();

      // Add class to be styled if desired
      $addToCart.removeClass("is-added").addClass("is-adding");

      // Remove any previous quantity errors
      $(".qty-error").remove();

      ShopifyAPI.addItemFromForm(
        evt.target,
        itemAddedCallback,
        itemErrorCallback
      );
    });
  };

  itemAddedCallback = function () {
    $addToCart.removeClass("is-adding").addClass("is-added");

    ShopifyAPI.getCart(cartUpdateCallback);
  };

  itemErrorCallback = function (XMLHttpRequest) {
    var data = eval("(" + XMLHttpRequest.responseText + ")");
    $addToCart.removeClass("is-adding is-added");

    if (data.message) {
      if (data.status === 422) {
        $formContainer.after(
          '<div class="errors qty-error">' + data.description + "</div>"
        );
      }
    }
  };

  cartUpdateCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);
    buildCart(cart);
  };

  buildCart = function (cart) {
    // Start with a fresh cart div
    $cartContainer.empty();

    // Show empty cart
    // console.log('cart',cart);

    if (cart.item_count === 0) {
      $cartContainer.append(
        '<p class="cart--empty-message">' +
          theme.strings.cartEmpty +
          "</p>\n" +
          '<p class="cookie-message">' +
          theme.strings.cartCookies +
          "</p>"
      );
      cartCallback(cart);

      return;
    }

    // Handlebars.js cart layout
    var items = [],
      item = {},
      data = {},
      source = $("#CartTemplate").html(),
      template = Handlebars.compile(source),
      discountData = ShopifyAPI.getFeeturesData("feetures_cart_coupon"),
      hasDiscount = false;
    var cartDiscount = false;
    // set var to add up total compare at price on the cart and then later subtract against current item prices
    var cartCompareTotal = 0;
    var checkoutBundleDiscountAmount = 0;

    if (discountData && discountData.hasOwnProperty("discountType")) {
      hasDiscount = true;

      if (discountData.discountType === "percentage") {
        if (!discountData.hasOwnProperty("percentage")) {
          discountData.percentage =
            parseInt(discountData.checkoutDiscountAmountTarget) /
            cart.items_subtotal_price;
          ShopifyAPI.saveFeeturesData("feetures_cart_coupon", discountData);
        }
      }
    }

    // Add each item to our handlebars.js data
    $.each(cart.items, function (index, cartItem) {
      /* Hack to get product image thumbnail
       *   - If image is not null
       *     - Remove file extension, add _small, and re-add extension
       *     - Create server relative link
       *   - A hard-coded url of no-image
       */
      var prodImg;
      var hasComparePrice = false;
      var unitPrice = null;
      if (cartItem.image !== null) {
        prodImg = cartItem.image
          .replace(/(\.[^.]*)$/, "_medium$1")
          .replace("http:", "");
      } else {
        prodImg =
          "//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif";
      }

      var comparePrice = 0;
      var itemRegPrice = 0;

      // compare at price logic
      $.ajax({
        url: "/products/" + cartItem.handle + ".js",
        dataType: "json",
        async: false,
        success: function (product) {
          product["compare_at_price"] = 0;
          product.variants.forEach(function (variant) {
            if (variant.id == cartItem.variant_id) {
              if (variant.compare_at_price !== null) {
                hasComparePrice = true;
                comparePrice = variant.compare_at_price * cartItem.quantity;
                hasDiscount = true;
                // add this to running tally of compare at prices
                cartCompareTotal += comparePrice;
              } else {
                itemRegPrice = variant.price * cartItem.quantity;
                cartCompareTotal += itemRegPrice;
              }
              return false;
            }
          });
        },
      });

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function (key, value) {
          if (key.charAt(0) === "_" || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function (key, value) {
          if (key.charAt(0) === "_" || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      // console.warn(cartItem);

      if (cartItem.discounted_price < cartItem.original_price) {
        hasComparePrice = true;
        hasDiscount = true;
        // set compare at price for the line item
        var comparePrice = (cartItem.compare_at_price =
          cartItem.original_line_price);
        // set discountedPrice to the new price
        var finalPrice = (cartItem.price =
          cartItem.discounted_price * cartItem.quantity);
      } else {
        var finalPrice = cartItem.final_price;
      }

      if (cartItem.unit_price_measurement) {
        unitPrice = {
          addRefererenceValue:
            cartItem.unit_price_measurement.reference_value !== 1,
          price: theme.Currency.formatMoney(
            cartItem.unit_price,
            settings.moneyFormat
          ),
          reference_value: cartItem.unit_price_measurement.reference_value,
          reference_unit: cartItem.unit_price_measurement.reference_unit,
        };
      }

      // if(hasDiscount && discountData.discountType === 'percentage') {
      //   // Update to discount line item pricing by the correct percentage
      //   cartItem.final_line_price = cartItem.final_line_price - (cartItem.final_line_price * discountData.percentage)
      // }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        variant_opt_1: cartItem.variant_options[0].toLowerCase(),
        // variant_opt_2: cartItem.variant_options[1].toLowerCase(),
        sellingPlanAllocation: cartItem.selling_plan_allocation,
        properties: cartItem.properties,
        itemAdd: cartItem.quantity + 1,
        itemMinus: cartItem.quantity - 1,
        itemQty: cartItem.quantity,
        price: theme.Currency.formatMoney(
          cartItem.original_line_price,
          settings.moneyFormat
        ),
        discountedPrice: theme.Currency.formatMoney(
          finalPrice,
          settings.moneyFormat
        ),
        comparePrice: theme.Currency.formatMoney(
          comparePrice,
          settings.moneyFormat
        ),
        hasComparePrice: hasComparePrice,
        discounts: cartItem.line_level_discount_allocations,
        vendor: cartItem.vendor,
        unitPrice: unitPrice,
      };

      if (cartItem.variant_options[1]) {
        item.variant_opt_2 = cartItem.variant_options[1].toLowerCase();
      }

      if (cartItem.product_title.toLowerCase() == "gift card") {
        item.isGiftCard = true;
      }

      items.push(item);
    });

    //free shipping at $55 math
    var totalPriceIncludingShipping,
      checkoutDiscountAmount,
      automaticDiscountCode;
    if (cart.total_price < 5500) {
      totalPriceIncludingShipping = cart.total_price + 495;
    } else {
      totalPriceIncludingShipping = cart.total_price;
    }

    if (discountData && discountData.hasOwnProperty("discountType")) {
      // if(discountData.discountType === 'percentage') {
      cartDiscount = true;
      checkoutDiscountAmount =
        cart.cart_level_discount_applications[0].total_allocated_amount;
      automaticDiscountCode = cart.cart_level_discount_applications[0].title;
      // } else {
      //   checkoutDiscountAmount = discountData.checkoutDiscountAmountTarget;
      // }
    }

    // Gather all cart data and add to DOM

    if (cartCompareTotal > 0) {
      // calc total discounted amount from compare at prices
      checkoutBundleDiscountAmount = cart.total_price - cartCompareTotal;
    }

    data = {
      items: items,
      note: cart.note,
      autoDiscountCode: automaticDiscountCode,
      totalPrice: theme.Currency.formatMoney(
        cart.original_total_price,
        settings.moneyFormat
      ),
      // cart total if a bundle is found in cart
      totalBundlePrice: theme.Currency.formatMoney(
        cartCompareTotal,
        settings.moneyFormat
      ),
      totalPricePlusShipping: theme.Currency.formatMoney(
        totalPriceIncludingShipping,
        settings.moneyFormat
      ),
      hasDiscount: hasDiscount,
      cartDiscount: cartDiscount
        ? theme.Currency.formatMoney(
            checkoutDiscountAmount,
            settings.moneyFormat
          )
        : false,
      cartBundleDiscount:
        cartCompareTotal > 0
          ? theme.Currency.formatMoney(
              Math.abs(checkoutBundleDiscountAmount),
              settings.moneyFormat
            )
          : false,
    };

    $cartContainer.append(template(data));

    // alert('cart updated');
    $(`[data-rebuy-id="64882"]`).remove();
    $(".ajaxcart__inner").append('<div data-rebuy-id="64882"></div>');
    if (window.Rebuy) {
      Rebuy.init();
    }

    cartCallback(cart);
  };

  cartCallback = function (cart) {
    $body.removeClass("drawer--is-loading");
    $body.trigger("ajaxCart.afterCartLoad", cart);

    //free shipping at $55 display
    if (cart.total_price < 5500) {
      var amountUntilFreeShip = 5500 - cart.total_price;
      amountUntilFreeShip /= 100;
      var amountUntilFreeShipFormatted = amountUntilFreeShip.toFixed(2);
      var percentUntilFreeShip = cart.total_price / 5500;
      percentUntilFreeShip *= 100;
      $(".drawer__ship-msg").text(
        "You're just $" + amountUntilFreeShipFormatted + " from free shipping!"
      );
      $(".drawer__ship-bar-inner").css("width", percentUntilFreeShip + "%");
      $(".ajaxcart__shipping-price").text("$4.95");
    } else {
      $(".drawer__ship-msg").text("Free shipping applied!");
      $(".drawer__ship-bar-inner").css("width", "100%");
      $(".ajaxcart__shipping-price").text("FREE");
    }

    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }
  };

  adjustCart = function () {
    // Delegate all events because elements reload with the cart

    // Add or remove from the quantity
    $body.on(
      "click",
      ".ajaxcart__qty-adjust, .ajaxcart__qty--remove",
      function () {
        if (isUpdating) {
          return;
        }

        var remove = false;
        if ($(this).hasClass("ajaxcart__qty--remove")) {
          remove = true;
        }

        var $el = $(this),
          line = $el.data("line"),
          $qtySelector;

        if (remove) {
          $qtySelector = $el
            .closest(".ajaxcart__product")
            .find(".ajaxcart__qty-num");
        } else {
          $qtySelector = $el.siblings(".ajaxcart__qty-num");
        }

        var qty = parseInt($qtySelector.val().replace(/\D/g, ""));

        qty = validateQty(qty);

        // Add or subtract from the current quantity
        if ($el.hasClass("ajaxcart__qty--plus")) {
          qty += 1;
        } else if (remove) {
          qty = 0;
        } else {
          qty -= 1;
          if (qty <= 0) qty = 0;
        }

        // If it has a data-line, update the cart.
        // Otherwise, just update the input's number
        if (line) {
          updateQuantity(line, qty);
        } else {
          $qtySelector.val(qty);
        }
      }
    );

    // Update quantity based on input on change
    $body.on("change", ".ajaxcart__qty-num", function () {
      if (isUpdating) {
        return;
      }
      var $el = $(this),
        line = $el.data("line"),
        qty = parseInt($el.val().replace(/\D/g, ""));

      qty = validateQty(qty);

      // If it has a data-line, update the cart
      if (line) {
        updateQuantity(line, qty);
      }
    });

    // Prevent cart from being submitted while quantities are changing
    $body.on("submit", "form.ajaxcart", function (evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });

    // Highlight the text when focused
    $body.on("focus", ".ajaxcart__qty-adjust", function () {
      var $el = $(this);
      setTimeout(function () {
        $el.select();
      }, 50);
    });

    function updateQuantity(line, qty) {
      isUpdating = true;

      // Add activity classes when changing cart quantities
      var $row = $('.ajaxcart__row[data-line="' + line + '"]').addClass(
        "is-loading"
      );

      if (qty === 0) {
        $row.parent().addClass("is-removed");
      }

      // Slight delay to make sure removed animation is done
      setTimeout(function () {
        ShopifyAPI.changeItem(line, qty, adjustCartCallback);
      }, 250);
    }

    // Save note anytime it's changed
    $body.on("change", 'textarea[name="note"]', function () {
      var newNote = $(this).val();

      // Update the cart note in case they don't click update/checkout
      ShopifyAPI.updateCartNote(newNote, function () {});
    });

    $body.on("click", ".coupon-code-button", function (e) {
      e.preventDefault();
      var couponField = $(this).prev(),
        coupon = couponField.val();
      $(".ajax-cart-coupon").find(".errors").remove();
      couponField.removeClass("error");
      if (coupon) {
        ShopifyAPI.updateDiscountData(
          coupon,
          loadCart,
          couponFieldErrorCallback
        );
      } else {
        couponField.addClass("error");
      }
    });

    $body.on("click", "[data-edit-coupon-code]", function (e) {
      e.preventDefault();
      $("#ajax-cart-coupon").prop("checked", true);
      $(".ajax-cart-coupon").removeClass("hide");
    });

    $body.on("click", "[data-remove-coupon-code]", function (e) {
      e.preventDefault();
      $(".ajax-cart-coupon").addClass("hide");
      localStorage.removeItem("feetures_cart_coupon");
      ShopifyAPI.getCart(buildCart);
    });
  };

  couponFieldErrorCallback = function () {
    $("body").removeClass("drawer--is-loading");
    $(".ajax-cart-coupon").append(
      '<div class="errors qty-error">Coupon code is not valid.</div>'
    );
  };

  adjustCartCallback = function (cart) {
    // Update quantity and price
    updateCountPrice(cart);

    // Reprint cart on short timeout so you don't see the content being removed
    setTimeout(function () {
      ShopifyAPI.getCart(buildCart);
      isUpdating = false;
    }, 150);
  };

  qtySelectors = function () {
    // Change number inputs to JS ones, similar to ajax cart but without API integration.
    // Make sure to add the existing name and id to the new input element
    var $numInputs = $('input[type="number"]');

    if ($numInputs.length) {
      $numInputs.each(function () {
        var $el = $(this),
          currentQty = $el.val(),
          inputName = $el.attr("name"),
          inputId = $el.attr("id");

        var itemAdd = currentQty + 1,
          itemMinus = currentQty - 1,
          itemQty = currentQty;

        var source = $("#JsQty").html(),
          template = Handlebars.compile(source),
          data = {
            key: $el.data("id"),
            itemQty: itemQty,
            itemAdd: itemAdd,
            itemMinus: itemMinus,
            inputName: inputName,
            inputId: inputId,
          };

        // Append new quantity selector then remove original
        $el.after(template(data)).remove();
      });

      // Setup listeners to add/subtract from the input
      $(".js-qty__adjust").on("click", function () {
        var $el = $(this),
          $qtySelector = $el.siblings(".js-qty__num"),
          qty = parseInt($qtySelector.val().replace(/\D/g, ""));

        qty = validateQty(qty);

        // Add or subtract from the current quantity
        if ($el.hasClass("js-qty__adjust--plus")) {
          qty += 1;
        } else {
          qty -= 1;
          if (qty < 1) qty = 0;
        }

        // Update the input's number
        $qtySelector.val(qty);
      });
    }
  };

  validateQty = function (qty) {
    if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return qty;
  };

  module = {
    init: init,
    load: loadCart,
  };

  return module;
})(ajaxCart || {}, jQuery);

/*============================================================================
  Money Format
  - Shopify.format money is defined in option_selection.js.
    If that file is not included, it is redefined here.
==============================================================================*/
window.timber = window.timber || {};
window.theme = window.theme || {};

timber.initCache = function () {
  timber.cache = {
    // General
    $html: $("html"),
    $body: $("body"),
    $window: $(window),

    // Navigation
    $navigation: $("#AccessibleNav"),

    // Product Page
    $optionSelector: $(".single-option-selector"),

    // Customer Pages
    $recoverPasswordLink: $("#RecoverPassword"),
    $hideRecoverPasswordLink: $("#HideRecoverPasswordLink"),
    $recoverPasswordForm: $("#RecoverPasswordForm"),
    $customerLoginForm: $("#CustomerLoginForm"),
    $passwordResetSuccess: $("#ResetSuccess"),
  };
};

timber.init = function () {
  timber.initCache();
  timber.accessibleNav();
  timber.drawersInit();
  timber.loginForms();
};

timber.accessibleNav = function () {
  var classes = {
    active: "nav-hover",
    focus: "nav-focus",
    outside: "nav-outside",
    hasDropdown: "site-nav--has-dropdown",
    link: "site-nav__link",
  };
  var selectors = {
    active: "." + classes.active,
    hasDropdown: "." + classes.hasDropdown,
    dropdown: "[data-meganav-dropdown]",
    link: "a",
    nextLink: "> a",
    parentLink: '[data-meganav-type="parent"]',
    childLink: '[data-meganav-type="child"]',
  };

  // var $nav = timber.cache.$navigation,
  var $nav = $(".header-wrapper");
  ($allLinks = $nav.find(selectors.link)),
    ($parents = $nav.find(selectors.hasDropdown)),
    ($childLinks = $nav.find(selectors.childLink)),
    ($topLevel = $parents.find(selectors.nextLink)),
    ($dropdowns = $nav.find(selectors.dropdown)),
    ($subMenuLinks = $dropdowns.find(selectors.link));

  // Mouseenter
  $parents.on("mouseenter touchstart", function (evt) {
    var $el = $(this);
    var evtType = evt.type;
    var $dropdowns = $nav.find(selectors.active);

    if (!$el.hasClass(classes.active)) {
      // force stop the click from happening
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }

    // Make sure we close any opened same level dropdown before opening a new one
    if (evtType === "touchstart" && $dropdowns.length > 0) {
      hideDropdown($el);
    }

    showDropdown($el);
  });

  $childLinks.on("touchstart", function (evt) {
    evt.stopImmediatePropagation();
  });

  $parents.on("mouseleave", function () {
    hideDropdown($(this));
  });

  $allLinks.on("focus", function () {
    handleFocus($(this));
  });

  $allLinks.on("blur", function () {
    removeFocus($topLevel);
  });

  // accessibleNav private methods
  function handleFocus($el) {
    var $newFocus = null,
      $previousItem = $el.parent().prev();

    // Always put tabindex -1 on previous element just in case the user is going backward.
    // In that case, we want to focus on the previous parent and not the previous parent childs

    $allLinks.attr("tabindex", "");

    if ($previousItem.hasClass(classes.hasDropdown)) {
      $previousItem.find(selectors.dropdown + " a").attr("tabindex", -1);
    }

    $newFocus = $el.parents(selectors.hasDropdown).find("> a");
    addFocus($newFocus);
  }

  function showDropdown($el) {
    var $toplevel = $el.find(selectors.nextLink);

    $toplevel.attr("aria-expanded", true);

    $el.addClass(classes.active);

    setTimeout(function () {
      timber.cache.$body.on("touchstart.MegaNav", function () {
        hideDropdowns();
      });
    }, 250);
  }

  function hideDropdown($el) {
    var $dropdowns = $nav.find(selectors.active);
    var $parentLink = $dropdowns.find(selectors.nextLink);

    $parentLink.attr("aria-expanded", false);

    $dropdowns.removeClass(classes.active);

    timber.cache.$body.off("touchstart.MegaNav");
  }

  function hideDropdowns() {
    var $dropdowns = $nav.find(selectors.active);
    $.each($dropdowns, function () {
      hideDropdown($(this));
    });
  }

  function addFocus($el) {
    $el.addClass(classes.focus);

    if ($el.attr("aria-expanded") !== undefined) {
      $el.attr("aria-expanded", true);
    }
  }

  function removeFocus($el) {
    $el.removeClass(classes.focus);

    $subMenuLinks.attr("tabindex", -1);

    if ($el.attr("aria-expanded") !== undefined) {
      $el.attr("aria-expanded", false);
    }
  }

  // Check if dropdown is outside of viewport
  function handleDropdownOffset($dropdowns) {
    var viewportSize = $(window).width();
    $dropdowns.removeClass(classes.outside);

    $.each($dropdowns, function () {
      var $dropdown = $(this);
      var dropdownOffset = $dropdown.offset().left + $dropdown.width();
      if (dropdownOffset > viewportSize) {
        $dropdown.addClass(classes.outside);
      }
    });
  }

  // timber.cache.$window.load(function () {
  //   handleDropdownOffset($dropdowns);
  // });

  timber.cache.$window.resize(function () {
    afterResize(function () {
      handleDropdownOffset($dropdowns);
    }, 250);
  });
};

timber.drawersInit = function () {
  timber.LeftDrawer = new timber.Drawers("NavDrawer", "left");
  if (theme.settings.cartType === "drawer") {
    timber.RightDrawer = new timber.Drawers("CartDrawer", "right", {
      onDrawerOpen: ajaxCart.load,
    });
  }
};

timber.getHash = function () {
  return window.location.hash;
};

timber.loginForms = function () {
  function showRecoverPasswordForm() {
    timber.cache.$recoverPasswordForm.show();
    timber.cache.$customerLoginForm.hide();
  }

  function hideRecoverPasswordForm() {
    timber.cache.$recoverPasswordForm.hide();
    timber.cache.$customerLoginForm.show();
  }

  timber.cache.$recoverPasswordLink.on("click", function (evt) {
    evt.preventDefault();
    showRecoverPasswordForm();
  });

  timber.cache.$hideRecoverPasswordLink.on("click", function (evt) {
    evt.preventDefault();
    hideRecoverPasswordForm();
  });

  // Allow deep linking to recover password form
  if (timber.getHash() === "#recover") {
    showRecoverPasswordForm();
  }
};

timber.resetPasswordSuccess = function () {
  timber.cache.$passwordResetSuccess.show();
};

/*============================================================================
  Drawer modules
  - Docs http://shopify.github.io/Timber/#drawers
==============================================================================*/
timber.Drawers = (function () {
  var Drawer = function (id, position, options) {
    var defaults = {
      close: ".js-drawer-close",
      open: ".js-drawer-open-button-" + position,
      openButtonLeftClass: "js-drawer-open-button-left",
      drawerLeftClass: "drawer--left",
      drawerRightClass: "drawer--right",
      openClass: "js-drawer-open",
      dirOpenClass: "js-drawer-open-" + position,
    };

    this.nodes = {
      $parent: $("body, html"),
      $page: $("#PageContainer"),
      $moved: $(".page-container"),
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $("#" + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function () {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr("aria-expanded", "false");

    $openBtn.on("click", $.proxy(this.open, this));
    this.$drawer.find(this.config.close).on("click", $.proxy(this.close, this));
  };

  Drawer.prototype.open = function (evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Other drawers that might be open (will be closed later)
    var $otherDrawers = $(".drawer").not(this.$drawer);

    // don't open an opened drawer
    if (this.drawerIsOpen) {
      if (evt) {
        evt.preventDefault();
      }
      return;
    }

    // Close other drawers if they are open
    var self = this;
    $otherDrawers.each(function () {
      if (!$(this).hasClass(self.config.openClass)) {
        return;
      }

      if ($(this).hasClass(self.config.drawerLeftClass)) {
        timber.LeftDrawer.close();
      }

      if ($(this).hasClass(self.config.drawerRightClass)) {
        timber.RightDrawer.close();
      }
    });

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.nodes.$moved.addClass("is-transitioning");
    this.$drawer.prepareTransition();

    this.nodes.$parent.addClass(
      this.config.openClass + " " + this.config.dirOpenClass
    );
    this.$drawer.addClass(this.config.openClass);

    this.drawerIsOpen = true;

    // Set focus on drawer
    Drawer.prototype.trapFocus({
      $container: this.$drawer,
      namespace: "drawer_focus",
    });

    // Run function when drawer opens if set
    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === "function"
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr("aria-expanded")) {
      this.$activeSource.attr("aria-expanded", "true");
    }

    this.bindEvents();
  };

  Drawer.prototype.close = function (evt) {
    // don't close a closed drawer
    if (!this.drawerIsOpen) {
      return;
    }

    if (evt.keyCode !== 27) {
      evt.preventDefault();
    }
    // deselect any focused form elements
    $(document.activeElement).trigger("blur");

    // Ensure closing transition is applied to moved elements, like the nav
    this.nodes.$moved.prepareTransition({ disableExisting: true });
    this.$drawer.prepareTransition({ disableExisting: true });

    this.nodes.$parent.removeClass(
      this.config.dirOpenClass + " " + this.config.openClass
    );
    this.$drawer.removeClass(this.config.openClass);

    this.drawerIsOpen = false;

    // Remove focus on drawer
    Drawer.prototype.removeTrapFocus({
      $container: this.$drawer,
      namespace: "drawer_focus",
    });

    if (this.$activeSource && this.$activeSource.attr("aria-expanded")) {
      this.$activeSource.attr("aria-expanded", "false");
    }

    this.unbindEvents();
  };

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  Drawer.prototype.trapFocus = function (options) {
    var eventName = options.namespace
      ? "focusin." + options.namespace
      : "focusin";

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
      options.$container.attr("tabindex", "-1");
    }

    options.$elementToFocus.focus();

    $(document).on(eventName, function (evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  };

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  Drawer.prototype.removeTrapFocus = function (options) {
    var eventName = options.namespace
      ? "focusin." + options.namespace
      : "focusin";

    if (options.$container && options.$container.length) {
      options.$container.removeAttr("tabindex");
    }

    $(document).off(eventName);
  };

  Drawer.prototype.bindEvents = function () {
    // Lock scrolling on mobile
    this.nodes.$page.on("touchmove.drawer", function () {
      return false;
    });

    this.$drawer.on("click.drawer", function (event) {
      if ($(this).hasClass("drawer--left")) {
        event.stopPropagation();
      }
    });

    $(".page-container, .drawer__header-container").on(
      "click.drawer",
      this.close.bind(this)
    );

    // Pressing escape closes drawer
    this.nodes.$parent.on(
      "keyup.drawer",
      $.proxy(function (evt) {
        // The hamburger 'open' button changes to a 'close' button when the drawer
        // is open. Clicking on it will close the drawer.
        if (this.$activeSource !== undefined) {
          this.$activeSource.on(
            "click.drawer",
            $.proxy(function () {
              if (
                !this.$activeSource.hasClass(this.config.openButtonLeftClass)
              ) {
                return;
              }
              this.close();
            }, this)
          );
        }
        if (evt.keyCode === 27) {
          this.close(evt);
        }
      }, this)
    );
  };

  Drawer.prototype.unbindEvents = function () {
    if (this.$activeSource !== undefined) {
      this.$activeSource.off(".drawer");
    }
    this.nodes.$page.off(".drawer");
    this.nodes.$parent.off(".drawer");
  };

  return Drawer;
})();

// Initialize Timber's JS on docready
$(timber.init);

/*
 * Shopify JS for customizing Slick.js
 *   http://kenwheeler.github.io/slick/
 *   Untouched JS in assets/slick.min.js
 */

theme.Slideshow = (function () {
  "use strict";

  var selectors = {
    activeSlide: ".slick-active",
    heroAdaptTextWrap: "[data-hero-adapt-text-wrap]",
    heroDotsWrapper: "[data-hero-dots-wrapper]",
    heroImage: "[data-hero-image]",
    heroTextContent: "[data-hero-text-content]",
    pagination: "[data-slide-pagination]",
    pause: "[data-pause]",
    slickList: ".slick-list",
    slidePrevious: "[data-slide-previous]",
    slideNext: "[data-slide-next]",
    slides: ".slick-slide",
  };

  var classes = {
    heroSlideHidden: "hero__slide--hidden",
    isPaused: "is-paused",
  };

  function Slideshow($slider) {
    var $sliderWrapper = $slider.closest("[data-section-id]");
    var loadSlideA11yString = (this.loadSlideA11yString =
      $slider.data("slide-nav-a11y"));
    var activeSlideA11yString = (this.activeSlideA11yString = $slider.data(
      "slide-nav-active-a11y"
    ));

    this.$slider = $slider;

    // Default settings
    this.settings = {
      $element: $slider,
      accessibility: true,
      adaptHeight: $slider.data("adapt"),
      arrows: true,
      dots: true,
      slide: "[data-hero-slide]",
      /* eslint-disable shopify/jquery-dollar-sign-reference */
      prevArrow: $slider.find(selectors.slidePrevious),
      nextArrow: $slider.find(selectors.slideNext),
      appendDots: $slider.find(selectors.heroDotsWrapper),
      /* eslint-enable shopify/jquery-dollar-sign-reference */
      adaptiveHeight: true,
      draggable: false,
      fade: true,
      focusOnChange: true,
      isTouch: false,
      autoplay: $slider.data("autoplay"),
      autoplaySpeed: $slider.data("autoplayspeed"),
      customPaging: function (slick, index) {
        var labelString =
          index === 0 ? activeSlideA11yString : loadSlideA11yString;
        return (
          '<a href="' +
          $slider.attr("id") +
          '" aria-label="' +
          labelString.replace("[slide_number]", index + 1) +
          '" data-slide-number="' +
          index +
          '" data-slide-pagination aria-controls="SlickSlide' +
          (index + 1) +
          '"></a>'
        );
      },
    };

    this.cache = {
      $window: $(window),
      $heroImage: $slider.find(selectors.heroImage),
      $heroText: $slider.find(selectors.heroTextContent),
      $pauseButton: $slider.find(selectors.pause),
      $textWrapperMobile: $sliderWrapper.find(selectors.heroAdaptTextWrap),
    };

    this.currentActiveSlide = 0;

    /*
     * Init slick slider
     *   - Add any additional option changes here
     *   - https://github.com/kenwheeler/slick/#options
     */
    this.$slider
      .on(
        "init",
        function (event, slick) {
          this.onInit(slick);
        }.bind(this)
      )
      .on(
        "beforeChange",
        function (event, slick, currentSlide, nextSlide) {
          this.beforeChange(slick, currentSlide, nextSlide);
        }.bind(this)
      )
      .on(
        "afterChange",
        function (event, slick) {
          this.afterChange(slick);
        }.bind(this)
      );

    this.$slider.slick(this.settings);
  }

  Slideshow.prototype = _.assignIn({}, Slideshow.prototype, {
    onInit: function (obj) {
      this.$allSlides = obj.$slides;
      this.$activeSlide = obj.$slider.find(
        selectors.slides + selectors.activeSlide
      );
      this.$pagination = obj.$slider.find(selectors.pagination);

      if (!this.settings.isTouch) {
        obj.$slides.addClass(classes.heroSlideHidden);
        this.$activeSlide.removeClass(classes.heroSlideHidden);
      }

      if (this.settings.autoplay) {
        this.cache.$pauseButton.on("click", this.togglePause.bind(this));

        $(document).scroll(
          theme.debounce(
            function () {
              var slideshowOffsetY =
                obj.$slider.offset().top + obj.$slider.outerHeight();

              if (slideshowOffsetY < window.pageYOffset) {
                this.togglePauseAttributes(this.cache.$pauseButton, false);
                obj.$slider.slick("slickPause");
              } else if (!this.cache.$pauseButton.hasClass(classes.isPaused)) {
                this.togglePauseAttributes(this.cache.$pauseButton, true);
                obj.$slider.slick("slickPlay");
              }
            }.bind(this),
            250
          )
        );
      }

      // Prevent default slick behaviour of autoplaying on mouseleave
      obj.$slider.find(selectors.slickList).off("mouseleave.slick");

      if (this.settings.adaptHeight) {
        this.showMobileText(0);
      }

      this.slideshowA11ySetup(obj.$slider);
      this.applySlideColor(0, 1);
    },

    beforeChange: function (obj, currentSlide, nextSlide) {
      obj.$slider.attr("data-slide-index", nextSlide);

      if (!this.settings.isTouch) {
        obj.$slides.removeClass(classes.heroSlideHidden);
      }

      if (this.settings.adaptHeight) {
        this.showMobileText(nextSlide);
      }

      this.applySlideColor(nextSlide, currentSlide);

      this.$pagination.each(
        function (index, element) {
          var labelString =
            index === nextSlide
              ? this.activeSlideA11yString
              : this.loadSlideA11yString;

          labelString = labelString.replace("[slide_number]", index + 1);

          $(element).attr("aria-label", labelString);
        }.bind(this)
      );

      // Set upcoming slide as index
      this.currentActiveSlide = nextSlide;
    },

    afterChange: function (obj) {
      if (this.settings.isTouch) {
        return;
      }

      this.$activeSlide = this.$slider.find(
        selectors.slides + selectors.activeSlide
      );

      obj.$slides.addClass(classes.heroSlideHidden).attr("aria-hidden", true);

      this.$activeSlide
        .removeClass(classes.heroSlideHidden)
        .attr("aria-hidden", false);
    },

    keyboardNavigation: function (evt) {
      if (evt.keyCode === 37) {
        this.$slider.slick("slickPrev");
      }
      if (evt.keyCode === 39) {
        this.$slider.slick("slickNext");
      }
    },

    togglePause: function (evt) {
      var $pauseButton = $(evt.currentTarget);
      var isPaused = $pauseButton.hasClass(classes.isPaused);

      this.togglePauseAttributes($pauseButton, isPaused);

      if (this.settings.autoplay) {
        if (isPaused) {
          this.$slider.slick("slickPlay");
        } else {
          this.$slider.slick("slickPause");
        }
      }
    },

    togglePauseAttributes: function ($pauseButton, isPaused) {
      if (this.settings.autoplay) {
        $pauseButton
          .toggleClass(classes.isPaused, !isPaused)
          .attr(
            "aria-label",
            isPaused
              ? $pauseButton.data("label-pause")
              : $pauseButton.data("label-play")
          );
      }
    },

    showMobileText: function (slideIndex) {
      var $allTextContent = this.cache.$textWrapperMobile.find(
        selectors.heroTextContent
      );
      var $currentTextContent = this.cache.$textWrapperMobile.find(
        '[data-index="' + slideIndex + '"]'
      );

      if (!$currentTextContent.length && this.$allSlides.length === 1) {
        this.cache.$textWrapperMobile.hide();
      } else {
        this.cache.$textWrapperMobile.show();
      }

      $allTextContent.hide();
      $currentTextContent.show();
    },

    // Apply when slideshow is in first position
    applySlideColor: function (nextSlideIndex, previousSlideIndex) {
      var prefixClassName = "hero--color-";

      this.$slider
        .removeClass(prefixClassName + previousSlideIndex)
        .addClass(prefixClassName + nextSlideIndex);
    },

    slideshowA11ySetup: function ($slider) {
      var $list = $slider.find(selectors.slickList);

      // When an element in the slider is focused
      // pause slideshow and set aria-live.
      $slider
        .on(
          "focusin mouseenter",

          function (evt) {
            if (
              !$slider.has(evt.target).length ||
              $list.attr("aria-live") === "polite"
            ) {
              return;
            }

            $list.attr("aria-live", "polite");
            if (this.settings.autoplay) {
              $slider.slick("slickPause");
            }
          }.bind(this)
        )
        .on(
          "focusout mouseleave",

          function (evt) {
            if ($slider.has(evt.relatedTarget).length) {
              return;
            }

            $list.removeAttr("aria-live");
            if (this.settings.autoplay) {
              // Only resume playing if the user hasn't paused using the pause
              // button
              if (!this.cache.$pauseButton.hasClass(classes.isPaused)) {
                $slider.slick("slickPlay");
              }
            }
          }.bind(this)
        )
        .on("keyup", this.keyboardNavigation.bind(this));

      $list.removeAttr("tabindex");

      this.$allSlides.each(function (index) {
        $(this)
          .attr("id", "SlickSlide" + (index + 1))
          .attr("aria-hidden", true);
      });

      this.$activeSlide.attr("aria-hidden", false);

      if (this.$allSlides.length > 1) {
        this.$pagination.each(function () {
          $(this).on("click keyup", function (evt) {
            if (evt.type === "keyup" && evt.which !== 13) return;

            evt.preventDefault();

            if (evt.type === "keyup") {
              $slider.focus();
            }
          });
        });
      }
    },
  });

  return Slideshow;
})();

theme.Disclosure = (function () {
  var selectors = {
    disclosureList: "[data-disclosure-list]",
    disclosureToggle: "[data-disclosure-toggle]",
    disclosureInput: "[data-disclosure-input]",
    disclosureOptions: "[data-disclosure-option]",
  };

  var classes = {
    listVisible: "disclosure-list--visible",
  };

  function Disclosure($disclosure) {
    this.$container = $disclosure;
    this.cache = {};
    this._cacheSelectors();
    this._connectOptions();
    this._connectToggle();
    this._onFocusOut();
  }

  Disclosure.prototype = _.assignIn({}, Disclosure.prototype, {
    _cacheSelectors: function () {
      this.cache = {
        $disclosureList: this.$container.find(selectors.disclosureList),
        $disclosureToggle: this.$container.find(selectors.disclosureToggle),
        $disclosureInput: this.$container.find(selectors.disclosureInput),
        $disclosureOptions: this.$container.find(selectors.disclosureOptions),
      };
    },

    _connectToggle: function () {
      this.cache.$disclosureToggle.on(
        "click",
        function (evt) {
          var ariaExpanded =
            $(evt.currentTarget).attr("aria-expanded") === "true";
          $(evt.currentTarget).attr("aria-expanded", !ariaExpanded);

          this.cache.$disclosureList.toggleClass(classes.listVisible);
        }.bind(this)
      );
    },

    _connectOptions: function () {
      this.cache.$disclosureOptions.on(
        "click",
        function (evt) {
          evt.preventDefault();
          this._submitForm($(evt.currentTarget).data("value"));
        }.bind(this)
      );
    },

    _onFocusOut: function () {
      this.cache.$disclosureToggle.on(
        "focusout",
        function (evt) {
          var disclosureLostFocus =
            this.$container.has(evt.relatedTarget).length === 0;

          if (disclosureLostFocus) {
            this._hideList();
          }
        }.bind(this)
      );

      this.cache.$disclosureList.on(
        "focusout",
        function (evt) {
          var childInFocus =
            $(evt.currentTarget).has(evt.relatedTarget).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(
            classes.listVisible
          );

          if (isVisible && !childInFocus) {
            this._hideList();
          }
        }.bind(this)
      );

      this.$container.on(
        "keyup",
        function (evt) {
          if (evt.which !== slate.utils.keyboardKeys.ESCAPE) return;
          this._hideList();
          this.cache.$disclosureToggle.focus();
        }.bind(this)
      );

      $("body").on(
        "click",
        function (evt) {
          var isOption = this.$container.has(evt.target).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(
            classes.listVisible
          );

          if (isVisible && !isOption) {
            this._hideList();
          }
        }.bind(this)
      );
    },

    _submitForm: function (value) {
      this.cache.$disclosureInput.val(value);
      this.$container.parents("form").submit();
    },

    _hideList: function () {
      this.cache.$disclosureList.removeClass(classes.listVisible);
      this.cache.$disclosureToggle.attr("aria-expanded", false);
    },

    unload: function () {
      this.cache.$disclosureOptions.off();
      this.cache.$disclosureToggle.off();
      this.cache.$disclosureList.off();
      this.$container.off();
    },
  });

  return Disclosure;
})();

theme.ProductModel = (function () {
  var modelJsonSections = {};
  var models = {};
  var xrButtons = {};

  var selectors = {
    productMediaGroup: "[data-product-single-media-group]",
    productMediaGroupWrapper: "[data-product-single-media-group-wrapper]",
    xrButton: "[data-shopify-xr]",
    xrButtonSingle: "[data-shopify-xr-single]",
  };

  var classes = {
    viewInSpaceDisabled: "product-single__view-in-space--disabled",
  };

  function init(modelViewerContainers, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false,
    };

    modelViewerContainers.each(function (index) {
      var $modelViewerContainer = $(this);
      var mediaId = $modelViewerContainer.data("media-id");

      var $modelViewerElement = $(
        $modelViewerContainer.find("model-viewer")[0]
      );
      var modelId = $modelViewerElement.data("model-id");

      if (index === 0) {
        var $xrButton = $modelViewerContainer
          .closest(selectors.productMediaGroupWrapper)
          .find(selectors.xrButtonSingle);

        xrButtons[sectionId] = {
          $element: $xrButton,
          defaultId: modelId,
        };
      }

      models[mediaId] = {
        modelId: modelId,
        sectionId: sectionId,
        $container: $modelViewerContainer,
        $element: $modelViewerElement,
      };
    });

    window.Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: setupShopifyXr,
      },
    ]);

    if (models.length < 1) return;
    window.Shopify.loadFeatures([
      {
        name: "model-viewer-ui",
        version: "1.0",
        onLoad: setupModelViewerUi,
      },
    ]);
    theme.LibraryLoader.load("modelViewerUiStyles");
  }

  function setupShopifyXr(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener("shopify_xr_initialized", function (event) {
        if (event.detail.shopifyXREnabled) {
          setupShopifyXr();
        } else {
          $(selectors.xrButton).addClass(classes.viewInSpaceDisabled);
        }
      });
      return;
    }

    for (var sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        var modelSection = modelJsonSections[sectionId];

        if (modelSection.loaded) continue;
        var $modelJson = $("#ModelJson-" + sectionId);

        window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
        modelSection.loaded = true;
      }
    }
    window.ShopifyXR.setupXRElements();
  }

  function setupModelViewerUi(errors) {
    if (errors) return;

    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
        }
        setupModelViewerListeners(model);
      }
    }
  }

  function setupModelViewerListeners(model) {
    var xrButton = xrButtons[model.sectionId];

    var $productMediaGroup = model.$container.closest(
      selectors.productMediaGroup
    );

    model.$element
      .on("shopify_model_viewer_ui_toggle_play", function () {
        theme.updateSlickSwipe($productMediaGroup, false);
      })
      .on("shopify_model_viewer_ui_toggle_pause", function () {
        theme.updateSlickSwipe($productMediaGroup, true);
      });

    model.$container.on("mediaVisible", function () {
      xrButton.$element.attr("data-shopify-model3d-id", model.modelId);
      model.modelViewerUi.play();
    });

    model.$container
      .on("mediaHidden", function () {
        xrButton.$element.attr("data-shopify-model3d-id", xrButton.defaultId);
        model.modelViewerUi.pause();
      })
      .on("xrLaunch", function () {
        model.modelViewerUi.pause();
      });
  }

  function removeSectionModels(sectionId) {
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (model.sectionId === sectionId) {
          models[key].modelViewerUi.destroy();
          delete models[key];
        }
      }
    }
    delete modelJsonSections[sectionId];
  }

  return {
    init: init,
    removeSectionModels: removeSectionModels,
  };
})();

//init functionality for "Feetures Video With Quote" section
if ($(".feeturesVideoWithQuote ").length) {
  theme.LibraryLoader.load("youtubeSdk");
  var player;
  var userAgentString = navigator.userAgent;
  var chromeAgent = userAgentString.indexOf("Chrome") > -1;

  function onPlayerReady(event) {
    if (chromeAgent) {
      player.mute();
    }
  }

  $(document).on("click", ".feeturesVideoWithQuote__play-icon", function () {
    $(this)
      .parents(".feeturesVideoWithQuote")
      .addClass("feeturesVideoWithQuote--active");
    player.playVideo();
  });
}

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
  //functionality for "Feetures Video With Quote" section
  if ($(".feeturesVideoWithQuote ").length) {
    player = new YT.Player("feeturesVideoWithQuotePlayer", {
      events: {
        onReady: onPlayerReady,
      },
    });
  } else {
    theme.ProductVideo.loadVideos(theme.ProductVideo.hosts.youtube);
  }
}

theme.ProductVideo = (function () {
  var videos = {};

  var hosts = {
    html5: "html5",
    youtube: "youtube",
  };

  var selectors = {
    productMediaWrapper: "[data-product-single-media-wrapper]",
    productMediaGroup: "[data-product-single-media-group]",
  };

  var attributes = {
    enableVideoLooping: "enable-video-looping",
    videoId: "video-id",
  };

  function init(videoContainer, sectionId) {
    if (!videoContainer.length) {
      return;
    }

    var videoElement = videoContainer.find("iframe, video")[0];
    var mediaId = videoContainer.data("mediaId");

    if (!videoElement) {
      return;
    }

    videos[mediaId] = {
      mediaId: mediaId,
      sectionId: sectionId,
      host: hostFromVideoElement(videoElement),
      container: videoContainer,
      element: videoElement,
      ready: function () {
        createPlayer(this);
      },
    };

    var video = videos[mediaId];

    switch (video.host) {
      case hosts.html5:
        window.Shopify.loadFeatures([
          {
            name: "video-ui",
            version: "1.1",
            onLoad: setupPlyrVideos,
          },
        ]);
        theme.LibraryLoader.load("plyrShopifyStyles");
        break;
      case hosts.youtube:
        theme.LibraryLoader.load("youtubeSdk");
        break;
    }
  }

  function setupPlyrVideos(errors) {
    if (errors) {
      fallbackToNativeVideo();
      return;
    }

    loadVideos(hosts.html5);
  }

  function createPlayer(video) {
    if (video.player) {
      return;
    }

    var productMediaWrapper = video.container.closest(
      selectors.productMediaWrapper
    );
    var enableLooping = productMediaWrapper.data(attributes.enableVideoLooping);

    switch (video.host) {
      case hosts.html5:
        // eslint-disable-next-line no-undef
        video.player = new Shopify.Plyr(video.element, {
          loop: { active: enableLooping },
        });

        var $productMediaGroup = $(video.container).closest(
          selectors.productMediaGroup
        );

        video.player.on("seeking", function () {
          theme.updateSlickSwipe($productMediaGroup, false);
        });

        video.player.on("seeked", function () {
          theme.updateSlickSwipe($productMediaGroup, true);
        });

        break;
      case hosts.youtube:
        var videoId = productMediaWrapper.data(attributes.videoId);

        video.player = new YT.Player(video.element, {
          videoId: videoId,
          events: {
            onStateChange: function (event) {
              if (event.data === 0 && enableLooping) event.target.seekTo(0);
            },
          },
        });
        break;
    }

    productMediaWrapper.on("mediaHidden xrLaunch", function () {
      if (!video.player) return;

      if (video.host === hosts.html5) {
        video.player.pause();
      }

      if (video.host === hosts.youtube && video.player.pauseVideo) {
        video.player.pauseVideo();
      }
    });

    productMediaWrapper.on("mediaVisible", function () {
      if (!video.player) return;

      if (video.host === hosts.html5) {
        video.player.play();
      }

      if (video.host === hosts.youtube && video.player.playVideo) {
        video.player.playVideo();
      }
    });
  }

  function hostFromVideoElement(video) {
    if (video.tagName === "VIDEO") {
      return hosts.html5;
    }

    if (video.tagName === "IFRAME") {
      if (
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
          video.src
        )
      ) {
        return hosts.youtube;
      }
    }
    return null;
  }

  function loadVideos(host) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.host === host) {
          video.ready();
        }
      }
    }
  }

  function fallbackToNativeVideo() {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];

        if (video.nativeVideo) continue;

        if (video.host === hosts.html5) {
          video.element.setAttribute("controls", "controls");
          video.nativeVideo = true;
        }
      }
    }
  }

  function removeSectionVideos(sectionId) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];

        if (video.sectionId === sectionId) {
          if (video.player) video.player.destroy();
          delete videos[key];
        }
      }
    }
  }

  return {
    init: init,
    hosts: hosts,
    loadVideos: loadVideos,
    removeSectionVideos: removeSectionVideos,
  };
})();

/* ================ Sections ================ */
window.theme = window.theme || {};

theme.Product = (function () {
  function Product(container) {
    var $window = $(window);
    var $container = (this.$container = $(container));
    var sectionId = $container.attr("data-section-id");
    this.initialUrlVariant = false;

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has("variant")) {
      this.initialUrlVariant = true;
    }

    this.settings = {
      productPageLoad: false,
      preloadImage: false,
      enableHistoryState: true,
      namespace: ".productSection",
      sectionId: sectionId,
    };

    this.selectors = {
      productMediaWrapper: "[data-product-single-media-wrapper]",
      productMediaWrapperWrapper: ".product-single__media-flex-wrapper",
      productMediaGroup: "[data-product-single-media-group]",
      productMediaFlexWrapper: "[data-product-single-media-flex-wrapper]",
      productMediaTypeModel: "[data-product-media-type-model]",
      productMediaTypeVideo: "[data-product-media-type-video]",
      productThumbnails: "[data-product-thumbnails]",
      productThumbnail: "[data-product-thumbnail]",
      productFullDetails: ".product-single__full-details",
      productImageZoom: "[data-mfp-src]",
      productForm: ".add-to-cart__form",
      addToCart: ".btn--add-to-cart",
      addToCartText: ".btn__text",
      priceContainer: "[data-price-container]",
      productPrice: "#ProductPrice",
      SKU: ".variant-sku",
      priceA11y: "#PriceA11y",
      comparePrice: "#ComparePrice",
      comparePriceA11y: "#ComparePriceA11y",
      comparePriceWrapper: ".product-single__price--wrapper",
      quantityElements: ".product-single__quantity",
      originalSelectorId: "#ProductSelect",
      singleOptionSelector: ".single-option-selector__radio",
      packSizeSelector: ".pack-size-selector__radio",
      radioWrapper: ".radio-wrapper",
      meta: ".product-single__meta",
      productWrapper: ".product-single",
      shopifyPaymentButton: ".shopify-payment-button",
      slickDots: "[data-slick-dots]",
      slickNext: "[data-slick-next]",
      slickPrevious: "[data-slick-previous]",
      unitPrice: "[data-unit-price]",
      unitPriceBaseUnit: "[data-unit-price-base-unit]",
      emailNotificationContainer: "[data-email-notification]",
      emailNotificationForm: "[data-email-notification] form",
      emailNotificationMsgSucess: "[data-email-notification] #successMessage",
      emailNotificationMsgError: "[data-email-notification] #errorMessage",
    };

    this.classes = {
      priceContainerUnitAvailable: "price-container--unit-available",
      activeThumb: "active-thumb",
      hide: "hide",
    };

    this.slickSettings = {
      slide: this.selectors.productMediaFlexWrapper,
      accessibility: true,
      arrows: true,
      appendDots: this.selectors.slickDots,
      prevArrow: this.selectors.slickPrevious,
      nextArrow: this.selectors.slickNext,
      dots: true,
      infinite: false,
      adaptiveHeight: true,
      customPaging: function (slick, index) {
        var slideA11yString = theme.strings.productSlideLabel
          .replace("[slide_number]", index + 1)
          .replace("[slide_max]", slick.slideCount);

        var mediaA11yString = $(
          '[data-slick-index="' + index + '"]',
          this.$container
        ).data("slick-media-label");

        var ariaCurrent = index === 0 ? ' aria-current="true"' : "";
        return (
          '<a href="#ProductMediaGroup-' +
          sectionId +
          '" aria-label="' +
          slideA11yString +
          " " +
          mediaA11yString +
          '" aria-controls="slick-slide0' +
          index +
          '"' +
          ariaCurrent +
          "></a>"
        );
      }.bind(this),
    };

    this.slickTranslateDistance = 0;
    this.isCarouselActive = false;

    if (!$("#ProductJson-" + sectionId).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(
      document.getElementById("ProductJson-" + sectionId).innerHTML
    );
    this.zoomType = $container.data("image-zoom-type");
    this.isStackedLayout = $container.data("stacked-layout");

    this.focusableElements = [
      "iframe",
      "input",
      "button",
      "video",
      '[tabindex="0"]',
    ].join(",");

    this.initBreakpoints();
    this.stringOverrides();
    this.initProductVariant();
    // this.initStickyProductMeta();
    this.productThumbnailSwitch();
    this.initProductVideo();
    this._initModelViewerLibraries();
    this._initShopifyXrLaunch();

    //reload page if user resizes from SMALL breakpoint to other breakpoint
    //needed because of all the carousel functionality on SMALL breakpoint
    var isbpSmallOnPageLoad = theme.variables.bpSmall;
    var reloadPageOnPageResize = function () {
      if (isbpSmallOnPageLoad != theme.variables.bpSmall) {
        location.reload();
      }
    };
    $window.on("resize", theme.debounce(reloadPageOnPageResize, 150));

    var productTitle = $(".product-single__title").text();
    if (window.location.pathname.toLowerCase().indexOf("women") >= 0) {
      //on PDP page for womens collection
      this.triggerGenderToggle("women");
    } else if (
      window.location.pathname.toLowerCase().indexOf("men") >= 0 ||
      productTitle.indexOf("Men") >= 0
    ) {
      //on PDP page for mens collection
      this.triggerGenderToggle("men");
    } else if (
      window.location.pathname.toLowerCase().indexOf("collections/youth") >=
        0 ||
      window.location.pathname.toLowerCase().indexOf("gift-card") >= 0
    ) {
      //on PDP page for youth collection
      //hide gender toggle, hide "large" option, hide "XL" option, select "small" option
      this.triggerGenderToggle("women");
      $(".product-single-gender-toggle").addClass("hide");
      $("#ProductSelect-option-1 .single-option-selector__label")
        .eq(3)
        .addClass("hide");
      $("#ProductSelect-option-1 .single-option-selector__label")
        .eq(2)
        .addClass("hide");
      $("#ProductSelect-option-1 .single-option-selector__radio").eq(0).click();
    } else {
      //on generic PDP page (not associated with a collection), default to women
      this.triggerGenderToggle("women");
    }

    if (this.zoomType) {
      this.productMediaZoom();
    }

    if (theme.settings.cartType === "drawer") {
      ajaxCart.init({
        formSelector: "#AddToCartForm--" + sectionId,
        cartContainer: "#CartContainer",
        addToCartSelector: "#AddToCart--" + sectionId,
        enableQtySelectors: true,
        moneyFormat: theme.strings.moneyFormat,
      });
    }

    $window
      .on("load" + this.settings.namespace, theme.initStickyProductMeta)
      .on(
        "resize" + this.settings.namespace,
        theme.debounce(this.initStickyProductMeta, 150).bind(this)
      );
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    initProductVariant: function () {
      var options = {
        $container: this.$container,
        enableHistoryState:
          this.$container.data("enable-history-state") || false,
        singleOptionSelector: this.selectors.singleOptionSelector,
        packSizeSelector: this.selectors.packSizeSelector,
        originalSelectorId:
          this.selectors.originalSelectorId + "--" + this.settings.sectionId,
        product: this.productSingleObject,
      };

      this.variants = new slate.Variants(options);
      this.$container.on(
        "variantChange" + this.settings.namespace,
        this.productPage.bind(this)
      );
      this.$container.on(
        "variantMediaChange" + this.settings.namespace,
        this.showVariantMedia.bind(this)
      );

      this.variants._onSelectChange();

      //initial page load, force correct media to display
      this.showVariantMedia({
        type: "variantMediaChange",
        variant: options.product.variants[0],
      });
      $(".product-single__media-group").removeClass("hide");

      var $genderToggleItems = $(".gender-toggle-item");
      if ($genderToggleItems.length) {
        $genderToggleItems.on(
          "click",
          function (evt) {
            this.triggerGenderToggle(evt.target.dataset.gender);
          }.bind(this)
        );
      }
    },

    initBreakpoints: function () {
      var self = this;
      var $container = self.$container;
      self.zoomType = $container.data("image-zoom-type");

      enquire.register(theme.variables.mediaQuerySmall, {
        match: function () {
          self.createMediaCarousel();
          if (self.zoomType) {
            if ($(self.selectors.productImageZoom).length) {
              // remove event handlers for product zoom on mobile
              $(self.selectors.productImageZoom).off();
            }
          }
        },
        unmatch: function () {
          self.destroyMediaCarousel();

          if (self.zoomType) {
            // reinit product zoom
            self.productMediaZoom();
          }
        },
      });
    },

    _initModelViewerLibraries: function () {
      if (!this.$container.data("has-model")) return;

      var $modelViewerElements = $(
        this.selectors.productMediaTypeModel,
        this.$container
      );
      theme.ProductModel.init($modelViewerElements, this.settings.sectionId);
    },

    _initShopifyXrLaunch: function () {
      $(document).on(
        "shopify_xr_launch",
        function () {
          var $currentMedia = $(
            this.selectors.productMediaWrapper +
              ":not(." +
              this.classes.hide +
              ")",
            this.$container
          );
          $currentMedia.trigger("xrLaunch");
        }.bind(this)
      );
    },

    initProductVideo: function () {
      var sectionId = this.settings.sectionId;

      $(this.selectors.productMediaTypeVideo, this.$container).each(
        function () {
          var $videoContainer = $(this);
          theme.ProductVideo.init($videoContainer, sectionId);
        }
      );
    },

    stringOverrides: function () {
      // Override defaults in theme.strings with potential
      // template overrides

      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    resizeElements: function () {
      $(this.selectors.productGridImages, this.$container).imagesLoaded(
        function () {
          $(this.selectors.productGridImages, this.$container);
        }
      );
    },

    showVariantMedia: function (evt) {
      var variant = evt.variant;
      var variantMediaId =
        this.settings.sectionId + "-" + variant.featured_media.id;

      var $newMedia = $(
        this.selectors.productMediaWrapperWrapper +
          '[data-media-id="' +
          variantMediaId +
          '"]'
      );

      var $newMediaExtra = $(
        this.selectors.productMediaWrapperWrapper +
          '[data-product-media-variant="' +
          variant.option1 +
          '"]'
      );

      this.triggerMediaChangeEvent(variantMediaId);

      var mediaIndex;

      if (variant && variant.featured_media) {
        this.setActiveThumbnail(variantMediaId);
      }

      if (
        theme.variables.bpSmall &&
        !this.$container.data("featured-product")
      ) {
        $(this.selectors.productMediaWrapperWrapper).removeClass(
          "product-single__media-flex-wrapper--active"
        );
        $newMediaExtra.addClass("product-single__media-flex-wrapper--active");

        if ($("[data-product-single-media-group-nav]").length >= 1) {
          //this check is for gift cards or other non-standard products
          $("[data-product-single-media-group-nav]").slick("slickGoTo", 0);

          //filter out any images that aren't associated with selected variant, nav-carousel
          $("[data-product-single-media-group-nav]").slick("slickUnfilter");
          $("[data-product-single-media-group-nav]")
            .slick("slickFilter", function () {
              return (
                $(this).is(
                  '[data-product-media-variant="' + variant.option1 + '"]'
                ) || $(this).is("[data-product-media-not-variant]")
              );
            })
            .slick("refresh");

          //filter out any images that aren't associated with selected variant, main-carousel
          $(this.selectors.productMediaGroup, this.$container).slick(
            "slickUnfilter"
          );
          $(this.selectors.productMediaGroup, this.$container)
            .slick("slickFilter", function () {
              return (
                $(this).is(
                  '[data-product-media-variant="' + variant.option1 + '"]'
                ) || $(this).is("[data-product-media-not-variant]")
              );
            })
            .slick("refresh");

          if (
            $("[data-product-single-media-group-nav] .slick-slide").length <= 6
          ) {
            $("[data-product-single-media-group-nav]").addClass(
              "slick-slider--disable-scrolling"
            );
          } else {
            $("[data-product-single-media-group-nav]").removeClass(
              "slick-slider--disable-scrolling"
            );
          }

          setTimeout(function () {
            //magnificPopup was breaking so have to re-call it here
            $("[data-mfp-src]").magnificPopup(
              theme.variables.magnificPopupZoomSettings
            );
          }, 200);
        }

        // Switch media variant on thumbnail layout for desktop view;
        // When a media variant is updated on mobile view, update the
        // desktop view also.
        if (!this.isStackedLayout) {
          this.switchMedia(variantMediaId);
        }
      } else {
        if (this.isStackedLayout) {
          mediaIndex = $newMedia.closest(".slick-slide").index();
          // Scroll to/reorder media unless it's the first photo on load
          if (mediaIndex !== 0 || theme.variables.productPageLoad) {
            // Move selected variant media to top, preventing scrolling
            var currentScroll = $(document).scrollTop();
            // $newMedia.addClass("product-single__media-wrapper--selected")
            $newMedia
              .closest(
                $(this.selectors.productMediaFlexWrapper, this.$container)
              )
              .prependTo($(this.selectors.productMediaGroup, this.$container));
            $(this.selectors.productMediaWrapperWrapper).removeClass(
              "product-single__media-flex-wrapper--active"
            );
            $newMediaExtra.addClass(
              "product-single__media-flex-wrapper--active"
            );
            $(document).scrollTop(currentScroll);
          }
        } else {
          // Switch media variant for thumbnail layout
          this.switchMedia(variantMediaId);
        }
      }

      if (!theme.variables.productPageLoad) {
        theme.variables.productPageLoad = true;
      }
    },

    triggerGenderToggle: function (gender) {
      //update breadcrumbs
      var breadcrumbHtml =
        $(".breadcrumb").length > 0
          ? $(".breadcrumb").html().toLowerCase()
          : "";
      var initialUrlVariant = this.initialUrlVariant;

      if (initialUrlVariant) {
        var selectedSize = $('[data-foobar="Size"]:checked').val();
        var variant = this.variants._getVariantFromOptions();

        if (selectedSize === "XLARGE") {
          gender = "men";
        }

        this.variants.$container.trigger({
          type: "variantMediaChange",
          variant: variant,
        });
      }

      if (gender == "men") {
        if (breadcrumbHtml.indexOf("women") >= 0) {
          breadcrumbHtml = breadcrumbHtml.replace(/\women/g, "men");
          $(".breadcrumb").html(breadcrumbHtml);
        }
      }
      if (gender == "women") {
        if (breadcrumbHtml.indexOf("women") == -1) {
          breadcrumbHtml = breadcrumbHtml.replace(/\men/g, "women");
          $(".breadcrumb").html(breadcrumbHtml);
        }
      }

      var $selectedGenderItem = $(
        ".gender-toggle-item[data-gender='" + gender + "']"
      );
      $selectedGenderItem.addClass("gender-toggle-item--selected");
      $selectedGenderItem
        .siblings()
        .removeClass("gender-toggle-item--selected");

      $(".single-option-selector__label").each(function () {
        $(this).removeClass("hide");
        if ($(this).get(0).dataset.exclusiveGender) {
          if ($(this).get(0).dataset.exclusiveGender !== gender) {
            //hide any variants (colors) that are marked as exclusively for the gender that is not selected
            $(this).addClass("hide");
          }
        }
      });

      var defaultWomensColor = $("#defaultWomensColor").text();
      var defaultMensColor = $("#defaultMensColor").text();
      var defaultWomensSize = "MEDIUM";
      var defaultMensSize = "LARGE";
      var defaultWomensSizeLabel = $(
        `label[for='ProductSelect-option-size-${defaultWomensSize}']`
      );
      var defaultMensSizeLabel = $(
        `label[for='ProductSelect-option-size-${defaultMensSize}']`
      );

      if (defaultWomensColor.length > 0) {
        var defaultWomensColorLabel = $(
          "[data-variant-value='" + defaultWomensColor + "']"
        );
      } else {
        if ($("[data-on-sale].single-option-selector__label:visible")) {
          defaultWomensColorLabel = $(
            "[data-on-sale].single-option-selector__label:visible"
          ).first();
        } else {
          defaultWomensColorLabel = $(
            ".single-option-selector__label:visible"
          ).first();
        }
      }

      var defaultWomensColorLabelSibling =
        defaultWomensColorLabel.nextAll("label:visible");
      if (defaultWomensColorLabelSibling.length == 0) {
        defaultWomensColorLabelSibling =
          defaultWomensColorLabel.prevAll("label:visible");
      }

      if (defaultMensColor.length > 0) {
        var defaultMensColorLabel = $(
          "[data-variant-value='" + defaultMensColor + "']"
        );
      } else {
        if ($("[data-on-sale].single-option-selector__label:visible")) {
          defaultMensColorLabel = $(
            "[data-on-sale].single-option-selector__label:visible"
          ).first();
        } else {
          defaultMensColorLabel = $(
            ".single-option-selector__label:visible"
          ).first();
        }
      }

      var defaultMensColorLabelSibling =
        defaultMensColorLabel.nextAll("label:visible");
      if (defaultMensColorLabelSibling.length == 0) {
        defaultMensColorLabelSibling =
          defaultMensColorLabel.prevAll("label:visible");
      }

      $("#ProductSelect-option-1 .single-option-selector__label").removeClass(
        "hide"
      );
      if (gender == "men") {
        if (!initialUrlVariant) {
          defaultMensColorLabel.click();
          defaultMensSizeLabel.click();
        }
        // hack for an edge-case. (when first visible variant-selector-label doesn't match the default media due to it being hidden because of exlusive-gender)
        // click away from the variant, then click back to activate the correct media
        if (defaultMensColorLabelSibling[0] && !initialUrlVariant) {
          defaultMensColorLabelSibling[0].click();
          defaultMensColorLabel.click();
          defaultMensSizeLabel.click();
        }
        //end hack

        //when men is activated, hide "S" option and select "L" option
        $("#ProductSelect-option-1 .single-option-selector__label").each(
          function () {
            if ($(this).text().trim() == "S") {
              $(this).addClass("hide");
            }
            if ($(this).text().trim() == "L" && !initialUrlVariant) {
              $(this).click();
            }
          }
        );
      } else if (gender == "women" || gender == "youth") {
        if (!initialUrlVariant) {
          defaultWomensColorLabel.click();
          defaultWomensSizeLabel.click();
        }
        // hack for an edge-case. (when first visible variant-selector-label doesn't match the default media due to it being hidden because of exlusive-gender)
        // click away from the variant, then click back to activate the correct media
        if (defaultWomensColorLabelSibling[0] && !initialUrlVariant) {
          defaultWomensColorLabelSibling[0].click();
          defaultWomensColorLabel.click();
          defaultWomensSizeLabel.click();
        }
        //end hack

        //when women is activated, hide "XL" option and select "M" option
        $("#ProductSelect-option-1 .single-option-selector__label").each(
          function () {
            var productTitle = $(".product-single__title").text();

            if (!productTitle.toLowerCase().includes("tee")) {
              if ($(this).text().trim() == "XL") {
                $(this).addClass("hide");
              }
              if ($(this).text().trim() == "M" && !initialUrlVariant) {
                $(this).click();
              }
            }
          }
        );
      }

      this.initialUrlVariant = false;
      //need to scroll to top of page since the above click()s cause the page focus to be lower down the page on mobile
      // window.scrollTo(0, 0);
    },

    triggerMediaChangeEvent: function (mediaId) {
      var $otherMedia = $(this.selectors.productMediaWrapper, this.$container);
      $otherMedia.trigger("mediaHidden");

      var $newMedia = $(
        this.selectors.productMediaWrapper,
        this.$container
      ).filter("#ProductMediaWrapper-" + mediaId);
      $newMedia.trigger("mediaVisible");
    },

    switchMedia: function (mediaId) {
      var $otherMedia = $(this.selectors.productMediaWrapper, this.$container);

      $otherMedia.addClass(this.classes.hide);
      var $newMedia = $(
        this.selectors.productMediaWrapper,
        this.$container
      ).filter("#ProductMediaWrapper-" + mediaId);
      $newMedia.removeClass(this.classes.hide);
    },

    productThumbnailSwitch: function () {
      var $productThumbnails = $(
        this.selectors.productThumbnails,
        this.$container
      ).find(this.selectors.productThumbnail);

      if ($productThumbnails.length) {
        // Switch the main media with one of the thumbnails
        // Note: this does not change the variant selected, just the media
        $productThumbnails
          .on(
            "click",
            function (evt) {
              evt.preventDefault();
              var newMediaId = $(evt.currentTarget).attr("data-media-id");

              this.switchMedia(newMediaId);
              this.setActiveThumbnail(newMediaId);
              this.triggerMediaChangeEvent(newMediaId);
            }.bind(this)
          )
          .on("keyup", this.handleMediaFocus.bind(this));
      }
    },

    handleMediaFocus: function (evt) {
      if (evt.keyCode !== 13) return;

      var mediaId = $(evt.currentTarget).data("media-id");

      $(
        this.selectors.productMediaWrapper +
          "[data-media-id='" +
          mediaId +
          "']",
        this.$container
      ).focus();
    },

    setActiveThumbnail: function (mediaId) {
      var $productThumbnails = $(
        this.selectors.productThumbnails,
        this.$container
      ).find(this.selectors.productThumbnail);
      if ($productThumbnails.length) {
        var $thumbnail = $(
          this.selectors.productThumbnail + "[data-media-id='" + mediaId + "']",
          this.$container
        );

        $productThumbnails.removeClass(this.classes.activeThumb);
        $thumbnail.addClass(this.classes.activeThumb);
      }
    },

    productMediaZoom: function () {
      if (!$(this.selectors.productImageZoom, this.$container).length) {
        return;
      }

      //add class to parent element of any image that triggers a youtube video so that we can style the image with a play icon
      $(this.selectors.productImageZoom, this.$container).each(function (
        index
      ) {
        if ($(this).hasClass("mfp-iframe")) {
          $(this)
            .closest(".product-single__media")
            .addClass("product-single__media--youtube");
        }
      });

      //allow clicking on the play-icon to simulate clicking on the image behind it
      $(document).on("click", ".product-single__media--youtube", function () {
        $(this).find("img").click();
      });
      $(this.selectors.productImageZoom, this.$container).magnificPopup(
        theme.variables.magnificPopupZoomSettings
      );
    },

    createMediaCarousel: function () {
      if (
        $(this.selectors.productMediaFlexWrapper).length < 2 ||
        !$(this.selectors.productMediaGroup, this.$container) ||
        this.isCarouselActive
      ) {
        return;
      }

      this.isCarouselActive = true;
      var dotStyle = {
        max: 9,
        width: 20,
      };

      var focusTrapped = false;
      $(this.selectors.productMediaFlexWrapper, this.$container).on(
        "focusin",
        function () {
          if (focusTrapped) {
            return;
          }
          this.trapCarouselFocus($(this.selectors.productMediaGroup));
          focusTrapped = true;
        }.bind(this)
      );

      //create a new carousel that will serve as the "nav" for the main carousel
      var $productMediaCarouselNav = $(
        this.selectors.productMediaGroup
      ).clone();
      $productMediaCarouselNav.appendTo(
        $(this.selectors.productMediaGroup).parent()
      );
      $productMediaCarouselNav.removeAttr("data-product-single-media-group");
      $productMediaCarouselNav.attr(
        "data-product-single-media-group-nav",
        "true"
      );
      $productMediaCarouselNav.removeClass("hide");
      var carouselNavImages = $productMediaCarouselNav.find("img");
      carouselNavImages.each(function (index) {
        // These classes spawn a lightbox and we don't want that on the carousel-nav images
        $(this).removeClass("mfp-image");
        $(this).removeClass("mfp-iframe");
      });

      //adjust settings for the main carousel
      slickSettingsForMainMobileCarousel = jQuery.extend(
        {},
        this.slickSettings
      );
      slickSettingsForMainMobileCarousel.asNavFor =
        "[data-product-single-media-group-nav]";
      (slickSettingsForMainMobileCarousel.prevArrow =
        '<button class="slick-prev slick-arrow" aria-label="Previous slide"><span></span></button>'),
        (slickSettingsForMainMobileCarousel.nextArrow =
          '<button class="slick-next slick-arrow" aria-label="Next slide"><span></span></button>');
      slickSettingsForMainMobileCarousel.infinite = true;

      //adjust settings for the nav carousel
      slickSettingsForNavMobileCarousel = jQuery.extend(
        {},
        slickSettingsForMainMobileCarousel
      );
      slickSettingsForNavMobileCarousel.asNavFor =
        "[data-product-single-media-group]";
      slickSettingsForNavMobileCarousel.arrows = false;
      slickSettingsForNavMobileCarousel.dots = false;
      slickSettingsForNavMobileCarousel.slidesToShow = 6;
      slickSettingsForNavMobileCarousel.focusOnSelect = true;

      $productMediaCarouselNav.slick(slickSettingsForNavMobileCarousel);

      $(this.selectors.productMediaGroup, this.$container)
        .slick(slickSettingsForMainMobileCarousel)
        .on(
          "beforeChange",
          function (event, slick, currentSlide, nextSlide) {
            this.updateCarouselDotsA11y(nextSlide);
            this.translateCarouselDots(slick.slideCount, nextSlide, dotStyle);
          }.bind(this)
        )
        .on(
          "afterChange",
          function (event, slick) {
            this.trapCarouselFocus(slick.$slider);
            // Let's do this after changing slides
            // Update featured media and active thumbnail on desktop
            // when changing slides
            this.setFeaturedMedia();
          }.bind(this)
        );

      if (this.isStackedLayout) return;
      var slideIndex = $(
        this.selectors.productMediaWrapper + ":not(." + this.classes.hide + ")",
        this.$container
      )
        .closest(this.selectors.productMediaFlexWrapper)
        .data("slick-index");

      if (!slideIndex) return;
      $(this.selectors.productMediaGroup, this.$container).slick(
        "slickGoTo",
        slideIndex,
        true
      );
    },

    updateCarouselDotsA11y: function (nextSlide) {
      var $dotLinks = $(this.selectors.slickDots).find("a");
      $dotLinks
        .removeAttr("aria-current")
        .eq(nextSlide)
        .attr("aria-current", "true");
    },

    translateCarouselDots: function (totalSlides, nextSlide, dotStyle) {
      if (totalSlides <= dotStyle.max) {
        return;
      }
      var calculatedTranslateDistance = 0;

      var maxTranslateDistance = (totalSlides - dotStyle.max) * dotStyle.width;
      if (nextSlide >= dotStyle.max - 1) {
        calculatedTranslateDistance =
          (nextSlide + 2 - dotStyle.max) * dotStyle.width;

        calculatedTranslateDistance =
          maxTranslateDistance < calculatedTranslateDistance
            ? maxTranslateDistance
            : calculatedTranslateDistance;
      }

      $(this.selectors.slickDots)
        .find("ul")
        .css("transform", "translateX(-" + calculatedTranslateDistance + "px)");
    },

    trapCarouselFocus: function ($slider, removeFocusTrap) {
      if (!$slider) return;

      $slider
        .find(".slick-slide:not(.slick-active)")
        .find(this.focusableElements)
        .attr("tabindex", removeFocusTrap ? "0" : "-1");

      $slider
        .find(".slick-active")
        .find(this.focusableElements)
        .attr("tabindex", "0");
    },

    setFeaturedMedia: function () {
      var mediaId = $(this.selectors.productMediaGroup, this.$container)
        .find(".slick-slide.slick-active " + this.selectors.productMediaWrapper)
        .attr("data-media-id");
      this.triggerMediaChangeEvent(mediaId);

      // Thumbnail layout only
      if (this.isStackedLayout) return;
      this.switchMedia(mediaId);
      this.setActiveThumbnail(mediaId);
    },

    destroyMediaCarousel: function () {
      if (
        !$(this.selectors.productMediaGroup, this.$container).length ||
        !this.isCarouselActive
      ) {
        return;
      }

      this.trapCarouselFocus(
        $(this.selectors.productMediaGroup, this.$container),
        true
      );

      $(this.selectors.productMediaGroup, this.$container).slick("unslick");
      this.isCarouselActive = false;
    },

    productPage: function (evt) {
      var moneyFormat = theme.strings.moneyFormat;
      var variant = evt.variant;
      var translations = theme.strings;

      if (variant) {
        $("label.unavailable").removeClass("unavailable");
        $("select.product-single__variants option").each(function (index) {
          var optionText = $(this).text().trim();
          var variantName = variant.option1;
          var variantSize = variant.option2;
          var match_item = optionText.startsWith(
            `${variantName} / ${variantSize} - `
          );
          // each size for the selected color:
          if (match_item) {
            if ($(this).attr("disabled")) {
              //disable the "size" buttons that are out of stock
              $(
                "label[for=ProductSelect-option-size-" +
                  $(this).attr("data-variant-size") +
                  "]"
              ).addClass("unavailable");
            }
          }

          // each color for the selected size:
          if ($(this).text().indexOf(variant.option2) >= 0) {
            //start: extra code to check becuase the above check doesn't take into account that "LARGE" is contained within "XLARGE"
            var match = false;
            var optionTextArrayOfWords = $(this).text().trim().split(" ");
            optionTextArrayOfWords.forEach(function (item) {
              if (variant.option2 == item) {
                match = true;
              }
            });
            if (!match) {
              return;
            }
            //end: extra code to check

            if ($(this).attr("disabled")) {
              //disable the "color" buttons that are out of stock
              $(
                "label[for=ProductSelect-option-color-" +
                  $(this).attr("data-variant-color") +
                  "]"
              ).addClass("unavailable");
              $(
                "label[for=ProductSelect-option-color-" +
                  $(this).attr("data-variant-color") +
                  "]"
              ).attr("aria-label", "This style is unavailable");
            }
          }
        });

        let quantity = variant.inventory_quantity;
        quantity -= 6; //set a "false floor" of 6

        $(".product-single__inventory-msg").attr(
          "class",
          "product-single__inventory-msg"
        );
        if (quantity <= 0) {
          variant.available = false;
          $(".product-single__inventory-msg").text("Out of Stock");
          $(".product-single__inventory-msg").addClass(
            "product-single__inventory-msg--oos"
          );
        } else if (quantity <= 20) {
          $(".product-single__inventory-msg").text("Hurry! Low in stock");
          $(".product-single__inventory-msg").addClass(
            "product-single__inventory-msg--limited"
          );
        } else {
          $(".product-single__inventory-msg").text("In stock & Ready to Ship");
          $(".product-single__inventory-msg").addClass(
            "product-single__inventory-msg--in-stock"
          );
        }

        //handle display of selected variant text (next to each variant label)
        if ($(".single-option-selected-value").length >= 1) {
          //this check is for gift cards or other non-standard products
          $(".single-option-selected-value")
            .eq(0)
            .text(variant.option1.toLowerCase());
        }
        if ($(".single-option-selected-value").length >= 2) {
          //this check is for gift cards or other non-standard products
          $(".single-option-selected-value")
            .eq(1)
            .text(variant.option2.toLowerCase());
        }

        //handle display of shoe size text (next to size label)
        var productTitle = $(".product-single__title").text();
        if (variant.option2) {
          var size = variant.option2.toLowerCase();
        } else {
          var size = ""; //for gift cards or other non-standard products
        }
        var gender;
        if (
          window.location.pathname.toLowerCase().indexOf("collections/youth") >=
          0
        ) {
          gender = "youth";
        } else if (productTitle.indexOf("Women") >= 0) {
          gender = "women";
        } else if (productTitle.indexOf("Men") >= 0) {
          gender = "men";
        } else if ($(".gender-toggle-item--selected").length) {
          gender = $(".gender-toggle-item--selected")[0].dataset.gender;
        } else {
          gender = ""; //for gift cards or other non-standard products
        }

        // Hide all size spans in options
        let sizeSpans = document.querySelectorAll(
          'label[for^="ProductSelect-option-size-"] span[class^="sizes-"'
        );
        for (let i = 0; i < sizeSpans.length; i++) {
          sizeSpans[i].style.display = "none";
        }

        if (gender == "women") {
          let sizeSpansWomen = document.querySelectorAll(
            'label[for^="ProductSelect-option-size-"] span.sizes-women'
          );
          for (let i = 0; i < sizeSpansWomen.length; i++) {
            sizeSpansWomen[i].style.display = "block";
          }
        }

        if (gender == "men") {
          let sizeSpansMen = document.querySelectorAll(
            'label[for^="ProductSelect-option-size-"] span.sizes-men'
          );
          for (let i = 0; i < sizeSpansMen.length; i++) {
            sizeSpansMen[i].style.display = "block";
          }
        }

        if (gender == "youth") {
          let sizeSpansYouth = document.querySelectorAll(
            'label[for^="ProductSelect-option-size-"] span.sizes-youth'
          );
          for (let i = 0; i < sizeSpansYouth.length; i++) {
            sizeSpansYouth[i].style.display = "block";
          }
        }

        //handle display of sale text (next to color label)
        if (variant.compare_at_price > variant.price) {
          var percentOff =
            (variant.compare_at_price - variant.price) /
            variant.compare_at_price;
          percentOff *= 100;
          percentOff = Math.floor(percentOff);
          $(".single-option-selected-value-helper")
            .eq(0)
            .text(percentOff + "% off");

          if (productTitle.includes("Pack")) {
            $(".product-single-price-helper").text(
              percentOff + "% bundle savings"
            );
          } else {
            // $('.product-single-price-helper').text(percentOff + "% off");
          }
        } else {
          $(".single-option-selected-value-helper").eq(0).text("");
          $(".product-single-price-helper").text("");
        }

        // Display variant media on featured product
        if (!$("body").hasClass("template-product")) {
          if (variant.featured_media) {
            var variantMediaId =
              this.settings.sectionId + "-" + variant.featured_media.id;
            var $newMedia = $(
              this.selectors.productMediaWrapper +
                '[data-media-id="' +
                variantMediaId +
                '"]',
              this.$container
            );
            var $otherMedia = $(
              this.selectors.productMediaWrapper +
                ':not([data-media-id="' +
                variantMediaId +
                '"])',
              this.$container
            );

            $newMedia.removeClass(this.classes.hide);
            $otherMedia.addClass(this.classes.hide);
          }
        }

        $(this.selectors.priceContainer, this.$container).removeClass(
          "visibility-hidden " + this.classes.priceContainerUnitAvailable
        );
        $(this.selectors.productPrice, this.$container).attr(
          "aria-hidden",
          "false"
        );
        $(this.selectors.priceA11y, this.$container).attr(
          "aria-hidden",
          "false"
        );

        // Select a valid variant if available
        if (
          variant.inventory_quantity > 6 ||
          window.location.pathname.toLowerCase().includes("gift-card")
        ) {
          // Hide email notification form
          $(this.selectors.emailNotificationContainer, this.$container).css(
            "display",
            "none"
          );
          // Available, enable the submit button, change text, show quantity elements
          $(this.selectors.addToCart, this.$container)
            .removeClass("disabled")
            .prop("disabled", false)
            .html("Add to Cart")
            .removeAttr("style");
          $(this.selectors.addToCartText, this.$container).html(
            translations.addToCart
          );
          $(this.selectors.quantityElements, this.$container).show();
          $(this.selectors.shopifyPaymentButton, this.$container).show();

          // Update the full details link
          var $link = $(this.selectors.productFullDetails, this.$container);
          if ($link.length) {
            $link.attr(
              "href",
              this.updateUrlParameter($link.attr("href"), "variant", variant.id)
            );
          }
        } else {
          // Sold out, disable the submit button, change text, hide quantity elements
          // button functionality is handled by klayvio script
          let addToCartButton = $(this.selectors.addToCart, this.$container);
          $(addToCartButton)
            .addClass("disabled")
            .prop("disabled", true)
            .css("display", "none");
          if (typeof variant.id === "string" && variant.id.includes("id-")) {
            $(addToCartButton).html("Unavailable").removeAttr("style");
            $(".product-single__inventory-msg").text("Unavailable");
            $(".product-single__inventory-msg").addClass(
              "product-single__inventory-msg--oos"
            );
            // Hide email notification form
            $(this.selectors.emailNotificationContainer, this.$container).css(
              "display",
              "none"
            );
            $(this.selectors.quantityElements, this.$container).hide();
            $(this.selectors.shopifyPaymentButton, this.$container).hide();
          } else {
            $(addToCartButton).html("Out of Stock");
            // WIP: change klaviyo BIS selector in the future, it currently only runs if inventory is actually 0
            // Reset and show temp klaviyo form
            $(
              this.selectors.emailNotificationContainer,
              this.$container
            ).removeAttr("style");
            $(this.selectors.emailNotificationForm, this.$container)
              .removeAttr("style")
              .trigger("reset");
            $(this.selectors.emailNotificationMsgError, this.$container).css(
              "display",
              "none"
            );
            $(this.selectors.emailNotificationMsgSucess, this.$container).css(
              "display",
              "none"
            );

            $(this.selectors.quantityElements, this.$container).hide();
            $(this.selectors.shopifyPaymentButton, this.$container).hide();
          }
        }

        $(this.selectors.productPrice, this.$container)
          .html(theme.Currency.formatMoney(variant.price, moneyFormat))
          .show();

        // Also update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          $(this.selectors.comparePrice, this.$container).html(
            theme.Currency.formatMoney(variant.compare_at_price, moneyFormat)
          );
          $(this.selectors.comparePriceWrapper, this.$container).removeClass(
            this.classes.hide
          );
          $(this.selectors.productPrice, this.$container).addClass("on-sale");
          $(this.selectors.comparePriceWrapper, this.$container).attr(
            "aria-hidden",
            "false"
          );
          $(this.selectors.comparePriceA11y, this.$container).attr(
            "aria-hidden",
            "false"
          );
        } else {
          $(this.selectors.comparePriceWrapper, this.$container)
            .addClass(this.classes.hide)
            .attr("aria-hidden", "true");
          $(this.selectors.productPrice, this.$container).removeClass(
            "on-sale"
          );
          $(this.selectors.comparePrice, this.$container).html("");
          $(this.selectors.comparePriceA11y, this.$container).attr(
            "aria-hidden",
            "true"
          );
        }

        if (variant.unit_price) {
          var $unitPrice = $(this.selectors.unitPrice, this.$container);
          var $unitPriceBaseUnit = $(
            this.selectors.unitPriceBaseUnit,
            this.$container
          );

          $unitPrice.html(
            theme.Currency.formatMoney(variant.unit_price, moneyFormat)
          );
          $unitPriceBaseUnit.html(this.getBaseUnit(variant));

          $(this.selectors.priceContainer, this.$container).addClass(
            this.classes.priceContainerUnitAvailable
          );
        }

        // Also Show SKU
        $(this.selectors.SKU).html(variant.sku);

        // LISTO - Limited Edition Colors OOS
        let leColors = $("[data-le-colors]")[0].innerHTML.split(",");
        let isLeColor =
          variant.options.filter((option) => leColors.includes(option)).length >
          0;
        $(".product-single__controls-wrapper").css("display", "flex");
        $("[data-le-colors-oos]").css("display", "none");
        if (variant.inventory_quantity < 7) {
          if (isLeColor) {
            $(".product-single__controls-wrapper").css("display", "none");
            $("[data-le-colors-oos]").css("display", "flex");
            $(".product-single__inventory-msg").text(
              "Limited Edition Color - Sold Out"
            );
            $(".product-single__inventory-msg").addClass(
              "product-single__inventory-msg--oos"
            );
            let addToCartButton = $(this.selectors.addToCart, this.$container);
            $(addToCartButton)
              .addClass("disabled")
              .prop("disabled", true)
              .css("display", "none")
              .html("Unavailable")
              .removeAttr("style");
            // Hide email notification form
            $(this.selectors.emailNotificationContainer, this.$container).css(
              "display",
              "none"
            );
            $(this.selectors.quantityElements, this.$container).hide();
            $(this.selectors.shopifyPaymentButton, this.$container).hide();
          }
        }
      } else {
        // The variant doesn't exist, disable submit button.
        // This may be an error or notice that a specific variant is not available.
        // To only show available variants, implement linked product options:
        //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options

        // Check for active inputs and pull their values into strings for labeling vs "unavailble"
        let selectedValue0 = $("#ProductSelect-option-0 input:checked")[0]
          .value;
        selectedValue0 =
          selectedValue0[0].toUpperCase() +
          selectedValue0.substring(1).toLowerCase();
        let selectedValue1 = $("#ProductSelect-option-1 input:checked")[0]
          .value;
        selectedValue1 =
          selectedValue1[0].toUpperCase() +
          selectedValue1.substring(1).toLowerCase();

        //update helper text to reflect that this variant is unavailable
        $(".single-option-selected-value").eq(0).text(selectedValue0);
        $(".single-option-selected-value").eq(1).text(selectedValue1);
        $(".single-option-selected-value-helper").eq(1).text("");
        $(".product-single__inventory-msg").eq(0).text("Unavailable");
        $(".product-single__inventory-msg").removeClass(
          "product-single__inventory-msg--in-stock"
        );

        $(this.selectors.addToCart, this.$container)
          .addClass("disabled")
          .prop("disabled", true);
        $(this.selectors.addToCartText, this.$container).html(
          translations.unavailable
        );
        $(this.selectors.quantityElements, this.$container).hide();
        $(this.selectors.shopifyPaymentButton, this.$container).hide();

        $(this.selectors.priceContainer, this.$container).addClass(
          "visibility-hidden"
        );
        $(this.selectors.productPrice, this.$container).attr(
          "aria-hidden",
          "true"
        );
        $(this.selectors.priceA11y, this.$container).attr(
          "aria-hidden",
          "true"
        );
        $(this.selectors.comparePriceWrapper, this.$container).attr(
          "aria-hidden",
          "true"
        );
        $(this.selectors.comparePriceA11y, this.$container).attr(
          "aria-hidden",
          "true"
        );
      }
    },

    updateUrlParameter: function (url, key, value) {
      var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
      var separator = url.indexOf("?") === -1 ? "?" : "&";

      if (url.match(re)) {
        return url.replace(re, "$1" + key + "=" + value + "$2");
      } else {
        return url + separator + key + "=" + value;
      }
    },

    initStickyProductMeta: function () {
      var $meta = $(this.selectors.meta, this.$container);
      var $wrapper = $(this.selectors.productWrapper, this.$container);

      if ($meta.find("#shopify-product-reviews").length) {
        theme.variables.productPageSticky = false;
        return;
      }

      if (
        !$meta.length ||
        $(this.selectors.productMediaWrapper, this.$container).length < 2
      ) {
        return;
      }

      // Detach and stop if on mobile breakpoint
      if (theme.variables.bpSmall) {
        return;
      }

      var productCopyHeight = $meta.outerHeight();
      var productMediaGroupHeight = $(
        this.selectors.productMediaGroup,
        this.$container
      ).height();

      /*============================================================================
        Calculate when to detach fixed element to avoid content overlap.
        Subtract product copy height from the limit because plugin uses offset().top
      ==============================================================================*/
      var calcLimit = $wrapper.offset().top + $wrapper.height();
      calcLimit -= productCopyHeight;

      // // Init sticky if desc shorter than images and fits in viewport
      // if (
      //   productCopyHeight < productMediaGroupHeight &&
      //   productCopyHeight < $(window).height()
      // ) {
      //   theme.variables.productPageSticky = true;
      //   $meta.scrollToFixed({
      //     limit: calcLimit,
      //   });
      // } else {
      //   theme.variables.productPageSticky = false;
      // }
    },

    onUnload: function () {
      this.$container.off(this.settings.namespace);
      theme.ProductModel.removeSectionModels(this.settings.sectionId);
      theme.ProductVideo.removeSectionVideos(this.settings.sectionId);
      this.destroyMediaCarousel();
    },

    getBaseUnit: function (variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    },
  });

  return Product;
})();

window.theme = window.theme || {};

theme.Collection = (function () {
  function Collection(container) {
    this.selectors = {
      productGridImages: ".grid-product__image-wrapper",
      $productGridRows: $(".collage-grid__row"),
      productGridPhotosLarge: ".grid__item--large .grid-product__image-link",
      $collectionImage: $(".collection-hero__image"),
      filterDropdowns: ".sortby-dropdown",
      filterSelect: ".sortby-dropdown__select",
      filterLabel: ".sortby-dropdown__label",
      sortDropdown: "#sortBy",
    };

    var $container = (this.$container = $(container));
    this.gridType = $container.data("grid-type");

    this.selectors.$collectionImage.addClass("is-init");

    // Enable parallax effect if 3d transforms are supported

    theme.cache.$window.on("scroll", function () {
      var scrolled = theme.cache.$window.scrollTop();
      theme.cache.$collectionImage.css({
        transform: "translate3d(0, " + scrolled / 4.5 + "px, 0)",
      });
    });

    this.init();
  }

  Collection.prototype = _.assignIn({}, Collection.prototype, {
    init: function () {
      $(document).on("collection-loaded", function (e) {
        productCardFunctionality();
        var onWomensPLP = false;
        var onMensPLP = false;
        var onYouthPLP = false;

        if (window.location.pathname.toLowerCase().indexOf("women") >= 0) {
          //on PLP page for mens collection
          onWomensPLP = true;
        } else if (window.location.pathname.toLowerCase().indexOf("men") >= 0) {
          //on PLP page for mens collection
          onMensPLP = true;
        } else if (
          window.location.pathname.toLowerCase().indexOf("youth") >= 0
        ) {
          //on PLP page for youth collection
          onYouthPLP = true;
        }

        $(".collectionGrid-item-product").each(function () {
          var womensDefaultColor = null,
            mensDefaultColor = null;
          if (
            $(this).data("womens-default-color") &&
            $(this).data("womens-default-color") !== ""
          ) {
            womensDefaultColor = $(this)
              .data("womens-default-color")
              .toString()
              .toLowerCase();
          }

          if (
            $(this).data("mens-default-color") &&
            $(this).data("womens-default-color") !== ""
          ) {
            mensDefaultColor = $(this)
              .data("mens-default-color")
              .toString()
              .toLowerCase();
          }

          var visibleVariantsOnSale = [],
            defaultColor = null;
          $(this)
            .find(
              ".variant-selector:visible:not(.variant-selector--color-duplicate)"
            )
            .each(function () {
              if ($(this).data("variant-compare-at-price")) {
                var compareAtPrice = $(this).data("variant-compare-at-price");
                var price = $(this).data("variant-price");

                if (price < compareAtPrice) {
                  visibleVariantsOnSale.push($(this));
                }
              }
            });

          if (onMensPLP && mensDefaultColor) {
            //if on Mens PLP page and the product has a "mens default color" set, select that color-chip when the page loads
            defaultColor = $(this)
              .find(
                ".grid-product__variants .variant-selector:visible:not(.variant-selector--color-duplicate)[data-variant-color='" +
                  mensDefaultColor +
                  "']"
              )
              .eq(0);
          } else if (onWomensPLP && womensDefaultColor) {
            //if on Womens PLP page and the product has a "womens default color" set, select that color-chip when the page loads
            defaultColor = $(this)
              .find(
                ".grid-product__variants .variant-selector:visible:not(.variant-selector--color-duplicate)[data-variant-color='" +
                  womensDefaultColor +
                  "']"
              )
              .eq(0);
          } else if (onYouthPLP && womensDefaultColor) {
            //if on Youth PLP page and the product has a "womens default color" set, select that color-chip when the page loads
            defaultColor = $(this)
              .find(
                ".grid-product__variants .variant-selector:visible:not(.variant-selector--color-duplicate)[data-variant-color='" +
                  womensDefaultColor +
                  "']"
              )
              .eq(0);
          }

          if (!defaultColor || defaultColor.length == 0) {
            if (visibleVariantsOnSale.length > 0) {
              // if one or more variants are on sale, select the first one that's on sale
              defaultColor = visibleVariantsOnSale[0];
            }
          }

          if (!defaultColor || defaultColor.length == 0) {
            //otherwise, select the first color-chip
            var defaultColor = $(this)
              .find(
                ".grid-product__variants .variant-selector:visible:not(.variant-selector--color-duplicate)"
              )
              .eq(0);
          }

          if (defaultColor && defaultColor.length == 1) {
            defaultColor.click();
          }
        });
      });

      $(document).on("collection-color-selected", function (e) {
        var color =
          e.hasOwnProperty("detail") && e.detail.hasOwnProperty("color")
            ? e.detail.color
            : false;
        $(".collectionGrid-item-product").each(function () {
          var variants = $(this).find(
            ".grid-product__variants .variant-selector:visible:not(.variant-selector--color-duplicate)"
          );
          for (var i = 0; i < variants.length; i++) {
            var filters = $(variants[i])
              .data("variant-color-filter-friendly")
              .split(",");
            if (filters.indexOf(color) !== -1) {
              $(variants[i]).click();
              return;
            }
          }
        });
      });

      //toggle visibility of filter-menu on collection page (for mobile)
      $(document).on(
        "click",
        ".collection-action-bar__filter-btn, .filters-header__close, .filters-footer__show-products",
        function () {
          $(".collection-action-bar__filters").toggleClass(
            "collection-action-bar__filters--show"
          );
        }
      );

      this.cacheSelectors();
      this.setQueryParams();

      this.cache.$sortDropdown.on("change", this.sortCollection.bind(this));

      if (this.gridType === "collage") {
        this.initCollageGrid();
      }
    },

    updateFilterLabel: function (evt, element) {
      var $select = evt ? $(evt.target) : $(element);
      var $label = $select
        .prev(".sortby-dropdown__label")
        .find(".sortby-dropdown__label--active");
      var selectedVariant = $select.find("option:selected").text();

      $label.html(" " + selectedVariant);
      this.cache.$filterDropdowns.addClass("loaded");
    },

    cacheSelectors: function () {
      this.cache = {
        $html: $("html"),
        $window: $(window),
        $productGridImages: $(this.selectors.productGridImages),
        $productGridRows: $(this.selectors.productGridRows),
        $productGridPhotosLarge: $(this.selectors.productGridPhotosLarge),
        $filterDropdowns: $(this.selectors.filterDropdowns),
        $filterSelect: $(this.selectors.filterSelect),
        $filterLabel: $(this.selectors.filterLabel),
        $sortDropdown: $(this.selectors.sortDropdown),
      };
    },

    setQueryParams: function () {
      //don't execute if sort dropdown is not present.
      if (!this.cache.$sortDropdown.length) {
        return;
      }

      Shopify.queryParams = this.parseQueryString();
    },

    parseQueryString: function () {
      if (!location.search.length) {
        return {};
      }

      var params = {};

      for (
        var aKeyValue, i = 0, aCouples = location.search.substr(1).split("&");
        i < aCouples.length;
        i++
      ) {
        aKeyValue = aCouples[i].split("=");
        if (aKeyValue.length > 1) {
          params[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(
            aKeyValue[1]
          );
        }
      }
      return params;
    },

    initCollageGrid: function () {
      if (!this.cache.$productGridRows.length) {
        return;
      }

      this.collageGridHeights();

      theme.cache.$window.on(
        "resize",
        theme.debounce(this.collageGridHeights, 500)
      );
    },

    collageGridHeights: function () {
      if (theme.variables.bpSmall || !this.cache.$productGridRows.length) {
        return;
      }

      // calculate image heights for each row of grid images
      for (var i = this.cache.$productGridRows.length - 1; i >= 0; i--) {
        var $currentRow = $(this.cache.$productGridRows[i]);
        var $smallImages = $currentRow.find(
          ".grid__item--small .grid-product__image-wrapper"
        );
        var $largeImageWrapper = $currentRow.find(
          ".grid__item--large .grid-product__image-wrapper"
        );
        var $largeImage = $largeImageWrapper.find(".grid-product__image-link");

        // calculate the bottom edge of the small image
        var smallImageOffset =
          $smallImages[1].offsetTop + $smallImages[1].offsetHeight;

        // calculate the bottom edge of the large image for the row
        var largeImageOffset =
          $largeImageWrapper[0].offsetTop + $largeImageWrapper[0].offsetHeight;

        var largeImageHeight = 0;

        // Depending on which image is lower, increase or decrease the large
        // image size
        if (smallImageOffset > largeImageOffset) {
          largeImageHeight =
            $largeImage.height() + (smallImageOffset - largeImageOffset);
        } else {
          largeImageHeight =
            $largeImage.height() - (largeImageOffset - smallImageOffset);
        }

        $largeImage.css("height", largeImageHeight);
      }
    },

    clearCollageGridHeights: function () {
      if (!this.cache.$productGridRows.length) {
        return;
      }

      this.cache.$productGridPhotosLarge.removeAttr("style");
    },

    collectionSorting: function () {
      if (!this.cache.$tagList.length) {
        return;
      }

      this.cache.$tagList.on("change", function () {
        window.location.href = $(this).val();
      });
    },

    sortCollection: function () {
      if (!this.cache.$sortDropdown.length) {
        return;
      }

      if (Shopify.queryParams.page) {
        delete Shopify.queryParams.page;
      }
      Shopify.queryParams.sort_by = this.cache.$sortDropdown.val();
      location.search = decodeURIComponent(jQuery.param(Shopify.queryParams));
    },
  });

  return Collection;
})();

window.theme = window.theme || {};

theme.HeaderSection = (function () {
  var classes = {
    headerWrapperTransparent: "header-wrapper--transparent",
  };

  function Header(container) {
    timber.drawersInit();
    theme.initCache();
    theme.fitNav();
    theme.resizeLogo();
    theme.searchModal();

    timber.cache.$window.resize(function () {
      afterResize(function () {
        theme.sizeCartDrawerFooter();
      }, 250);
    });

    var $container = (this.$container = $(container));
    this.template = $container.attr("data-template");
    this.$headerWrapper = theme.cache.$siteHeader.closest(
      "[data-header-wrapper]"
    );

    // ajaxCart.init will run from Product.prototype when on the product page
    if (
      theme.settings.cartType === "drawer" &&
      this.template.indexOf("product") === -1
    ) {
      ajaxCart.init({
        formSelector: ".add-to-cart__form",
        cartContainer: "#CartContainer",
        addToCartSelector: ".add-to-cart",
        enableQtySelectors: true,
        moneyFormat: theme.strings.moneyFormat,
      });
    }

    theme.cache.$window.on("load", theme.resizeLogo);
    theme.cache.$window.on("resize", theme.debounce(theme.resizeLogo, 150));

    this.initSideBarDropDowns();
    this.initSideBarSlideOuts();
    this.updateHeaderTransparency();

    // Reorder & load events for all section
    // Only trigger when sections list contain slideshow
    $(document).on(
      "shopify:section:reorder shopify:section:load",
      this.updateHeaderTransparency.bind(this)
    );

    // setTimeout is added since we want to see the newest DOM structure
    // unLoad is triggered before the removal of the DOM
    $(document).on(
      "shopify:section:unload",
      function () {
        setTimeout(this.updateHeaderTransparency.bind(this));
      }.bind(this)
    );
  }

  Header.prototype = _.assignIn({}, Header.prototype, {
    onSelect: function () {
      this.handleDrawerOpenInEditor(event);
    },

    onDeselect: function () {
      timber.LeftDrawer.close(event);
    },

    handleDrawerOpenInEditor: function (event) {
      if (
        theme.cache.$siteNav.hasClass("site-nav--compress") ||
        theme.variables.bpSmall
      ) {
        setTimeout(function () {
          timber.LeftDrawer.drawerIsOpen = false;
          timber.LeftDrawer.open();
        }, 500);
      } else if (!theme.cache.$siteNav.hasClass("site-nav--compress")) {
        timber.LeftDrawer.drawerIsOpen = true;
        timber.LeftDrawer.close(event);
      }
    },
    initSideBarDropDowns: function () {
      var $toggleBtns = $(".mobile-nav__has-dropdown");
      // Setup aria attributes
      $toggleBtns.attr("aria-expanded", "false");

      $toggleBtns.each(function () {
        var $button = $(this);
        $button.attr("aria-controls", $button.attr("data-aria-controls"));

        if ($button.hasClass("secondary-dropdown-toggle")) {
          $button.toggleClass("secondary-dropdown-toggle--expanded", false);
        }

        if ($button.hasClass("mobile-nav__has-dropdown")) {
          $button.toggleClass("mobile-nav__has-dropdown--expanded", false);
        }

        $button.next().slideToggle(0);
      });

      $toggleBtns.on("click", function () {
        var $button = $(this);
        var currentlyExpanded = $button.attr("aria-expanded");
        var toggleState = false;
        // Updated aria-expanded value based on state pre-click
        if (currentlyExpanded === "true") {
          $button.attr("aria-expanded", "false");
        } else {
          $button.attr("aria-expanded", "true");
          toggleState = true;
        }

        // Toggle that expands/collapses sublist
        if ($button.hasClass("secondary-dropdown-toggle")) {
          $button.toggleClass(
            "secondary-dropdown-toggle--expanded",
            toggleState
          );
        }

        if ($button.hasClass("mobile-nav__has-dropdown")) {
          $button.toggleClass(
            "mobile-nav__has-dropdown--expanded",
            toggleState
          );
        }
        $button.next().slideToggle(0);
      });
    },

    initSideBarSlideOuts: function () {
      var $toggleBtns = $(".mobile-nav__toggle");
      // Setup aria attributes
      $toggleBtns.attr("aria-expanded", "false");

      $toggleBtns.each(function () {
        var $button = $(this);
        $button.attr("aria-controls", $button.attr("data-aria-controls"));
      });

      $toggleBtns.on("click", function () {
        var $button = $(this);
        var currentlyExpanded = $button.attr("aria-expanded");
        var toggleState = false;
        var sublistHeader = $(this)
          .parents(".mobile-nav__has-sublist")
          .next()
          .find(".mobile-nav__sublist-header");

        // Updated aria-expanded value based on state pre-click
        if (currentlyExpanded === "true") {
          $button.attr("aria-expanded", "false");
        } else {
          $button.attr("aria-expanded", "true");
          toggleState = true;
        }

        sublistHeader.on("click", function () {
          $button
            .closest(".mobile-nav__has-sublist")
            .next()
            .animate({ width: "hide" }, 0);
        });

        // Toggle that expands/collapses sublist
        $button
          .closest(".mobile-nav__has-sublist")
          .toggleClass("mobile-nav--expanded", true)
          .next()
          .animate({ width: "show" }, 0);
      });
    },

    /**
     * Check whether the first section is slideshow
     * and enable transparency setting (header) is enabled
     */
    updateHeaderTransparency: function () {
      var $sectionsWrapper = theme.cache.$body.find("[data-sections-wrapper]");
      var $firstSection = $sectionsWrapper.find("[data-section-type]").first();

      this.$headerWrapper.removeClass(classes.headerWrapperTransparent);

      if (
        $firstSection.data("section-type") === "slideshow-section" &&
        theme.cache.$siteHeader.data("transparent-header") === true
      ) {
        this.$headerWrapper.addClass(classes.headerWrapperTransparent);
      }
    },
  });

  return Header;
})();

window.theme = window.theme || {};

theme.FeaturedContentSection = (function () {
  function FeaturedContent() {
    theme.styleTextLinks();
  }

  return FeaturedContent;
})();

window.theme = window.theme || {};

theme.NewsletterSection = (function () {
  function Newsletter() {
    theme.styleTextLinks();
  }

  return Newsletter;
})();

theme.slideshows = {};

theme.SlideshowSection = (function () {
  var classes = {
    headerWrapperTransparent: "header-wrapper--transparent",
    isPaused: "is-paused",
  };

  var selectors = {
    pause: "[data-pause]",
    headerWrapper: "[data-header-wrapper]",
  };

  function SlideshowSection(container) {
    theme.initCache();

    var $container = $(container);
    var sectionId = $container.attr("data-section-id");
    var slideshow = "#Hero-" + sectionId;
    this.$slideshow = $(slideshow);
    this.autoplay = this.$slideshow.data("autoplay");
    this.$headerWrapper = theme.cache.$siteHeader.closest(
      selectors.headerWrapper
    );

    theme.slideshows[slideshow] = new theme.Slideshow(this.$slideshow);

    // remove header absolute display if slideshow is empty
    if (!this.$slideshow.hasClass("hero")) {
      this.$headerWrapper.removeClass(classes.headerWrapperTransparent);
    }

    if (Shopify.designMode) {
      // Fix the slideshow height in the iOS theme editor
      this.setSlideshowHeight(this.$slideshow);
    }
  }

  SlideshowSection.prototype = _.assignIn({}, SlideshowSection.prototype, {
    onUnload: function () {
      this.$slideshow.slick("unslick");
    },

    onBlockSelect: function (evt) {
      var $slide = $(".slide--" + evt.detail.blockId);
      var slideIndex = $slide.attr("index");

      // Go to selected slide, pause autoplay
      this.$slideshow.slick("slickGoTo", slideIndex);

      if (this.autoplay) {
        this.$slideshow.slick("slickPause");
      }
    },

    onBlockDeselect: function () {
      var $pauseButton = this.$slideshow.find(selectors.pause);

      if (this.autoplay && $pauseButton.hasClass(classes.isPaused)) {
        this.$slideshow.slick("slickPlay");
      }
    },

    setSlideshowHeight: function ($slideshow) {
      enquire.register(theme.variables.mediaQuerySmall, {
        match: function () {
          $slideshow.css("height", $(window.parent.document).height());
        },
        unmatch: function () {
          $slideshow.removeAttr("height");
        },
      });
    },
  });

  return SlideshowSection;
})();

window.theme = window.theme || {};

theme.SockHeightCarousel = (function () {
  function SockHeightCarousel(container) {
    theme.initCache();
    const _this = this;
    var slideshow = container;
    this.$slideshow = $(slideshow);

    this.$slideshow.on("init", function (event, slick) {
      setTimeout(() => {
        _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
      }, 500);
    });

    this.$slideshow.slick({
      accessibility: true,
      arrows: true,
      prevArrow:
        '<button class="slick-prev slick-arrow" aria-label="Previous slide"><span></span></button>',
      nextArrow:
        '<button class="slick-next slick-arrow" aria-label="Next slide"><span></span></button>',
      appendArrows: ".feeturesSockHeightCarouselSlider__controls",
      slide: ".feeturesSockHeightCarouselSlider__item",
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      centerMode: true,
      responsive: [
        {
          breakpoint: 999,
          settings: {
            slidesToShow: 1,
            centerMode: false,
          },
        },
      ],
    });
    this.$slideshow.on("afterChange", function (event, slick, currentSlide) {
      _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
    });
  }

  SockHeightCarousel.prototype = _.assignIn({}, SockHeightCarousel.prototype, {
    onUnload: function () {
      this.$slideshow.slick("unslick");
    },
  });

  return SockHeightCarousel;
})();

theme.SockCategoryCarousel = (function () {
  function SockCategoryCarousel(container) {
    theme.initCache();
    const _this = this;
    var slideshow = container;
    this.$slideshow = $(slideshow);

    this.$slideshow.on("init", function (event, slick) {
      setTimeout(() => {
        _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
      }, 500);
    });

    this.$slideshow.slick({
      accessibility: true,
      arrows: true,
      prevArrow:
        '<button class="slick-prev slick-arrow" aria-label="Previous slide"><span></span></button>',
      nextArrow:
        '<button class="slick-next slick-arrow" aria-label="Next slide"><span></span></button>',
      appendArrows: ".feeturesSockCategoryCarouselSlider__controls",
      slide: ".feeturesSockCategoryCarouselSlider__item",
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 1,
      centerMode: false,
      responsive: [
        {
          breakpoint: 999,
          settings: {
            slidesToShow: 1,
            centerMode: false,
          },
        },
      ],
    });
    this.$slideshow.on("afterChange", function (event, slick, currentSlide) {
      _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
    });
  }

  SockCategoryCarousel.prototype = _.assignIn(
    {},
    SockCategoryCarousel.prototype,
    {
      onUnload: function () {
        this.$slideshow.slick("unslick");
      },
    }
  );

  return SockCategoryCarousel;
})();

theme.ProductCarousel = (function () {
  function ProductCarousel(container) {
    theme.initCache();
    const _this = this;
    let slideshow = container;
    this.$slideshow = $(slideshow);
    this.$sectionWrapper = this.$slideshow.closest('[id^="shopify-section-"]');

    this.$slideshow.on("init", function (event, slick) {
      setTimeout(() => {
        _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
      }, 500);
    });

    this.$slideshow.slick({
      accessibility: true,
      arrows: true,
      prevArrow:
        '<button class="slick-prev slick-arrow" aria-label="Previous slide"><span></span></button>',
      nextArrow:
        '<button class="slick-next slick-arrow" aria-label="Next slide"><span></span></button>',
      appendArrows: `#${this.$sectionWrapper.attr(
        "id"
      )} * #${this.$slideshow.attr(
        "id"
      )}-controls.feeturesProductCarouselSlider__controls`,
      slide: `#${this.$sectionWrapper.attr("id")} * #${this.$slideshow.attr(
        "id"
      )}-item.feeturesProductCarouselSlider__item`,
      dots: false,
      infinite: false,
      speed: 300,
      slidesToShow: 4,
      centerMode: false,
      responsive: [
        {
          breakpoint: 1075,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 479,
          settings: {
            slidesToShow: 1,
            centerMode: true,
          },
        },
      ],
    });
    this.$slideshow.on("afterChange", function (event, slick, currentSlide) {
      _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
    });
  }

  ProductCarousel.prototype = _.assignIn({}, ProductCarousel.prototype, {
    onUnload: function () {
      this.$slideshow.slick("unslick");
    },
  });

  return ProductCarousel;
})();

//quote carousel

theme.QuoteCarousel = (function () {
  function QuoteCarousel(container) {
    theme.initCache();
    const _this = this;
    var slideshow = container;
    this.$slideshow = $(slideshow);

    this.$slideshow.on("init", function (event, slick) {
      setTimeout(() => {
        _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
      }, 500);
    });

    this.$slideshow.slick({
      accessibility: true,
      arrows: true,
      prevArrow:
        '<button class="slick-prev slick-arrow" aria-label="Previous slide"><span></span></button>',
      nextArrow:
        '<button class="slick-next slick-arrow" aria-label="Next slide"><span></span></button>',
      appendArrows: ".feeturesQuoteCarouselSlider__controls",
      slide: ".feeturesQuoteCarouselSlider__item",
      dots: false,
      infinite: false,
      speed: 300,
      slidesToShow: 3,
      centerMode: false,
      responsive: [
        {
          breakpoint: 999,
          settings: {
            slidesToShow: 1,
            centerMode: false,
            dots: true,
            appendDots: ".feeturesQuote__dots",
          },
        },
      ],
    });
    this.$slideshow.on("afterChange", function (event, slick, currentSlide) {
      _this.$slideshow.find("[aria-hidden]").removeAttr("aria-hidden");
    });
  }

  QuoteCarousel.prototype = _.assignIn({}, QuoteCarousel.prototype, {
    onUnload: function () {
      this.$slideshow.slick("unslick");
    },
  });

  return QuoteCarousel;
})();

theme.PasswordHeader = (function () {
  function PasswordHeader() {
    this.init();
  }

  PasswordHeader.prototype = _.assignIn({}, PasswordHeader.prototype, {
    init: function () {
      $(".js-toggle-login-modal").magnificPopup({
        type: "inline",
        mainClass: "mfp-fade",
        closeOnBgClick: false,
        closeBtnInside: false,
        closeOnContentClick: false,
        tClose: password.strings.pageClose,
        removalDelay: 500,
        callbacks: {
          open: function () {
            window.setTimeout(function () {
              document.getElementById("password").focus();
            }, 50);
          },
          close: function () {
            window.setTimeout(function () {
              document.getElementById("email").focus();
            }, 50);
          },
        },
      });
      if ($(".storefront-password-form .errors").size()) {
        $(".js-toggle-login-modal").click();
      }
    },
  });

  return PasswordHeader;
})();

window.theme = window.theme || {};

theme.PasswordContent = (function () {
  function PasswordContent() {
    theme.styleTextLinks();
  }

  return PasswordContent;
})();

window.theme = window.theme || {};

theme.ProductRecommendations = (function () {
  function ProductRecommendations(container) {
    this.$container = $(container);
    let parentSection = $(container).parents(
      '[id^="shopify-section-product-recommendations"]'
    );
    let baseUrl = this.$container.data("baseUrl");
    let productId = this.$container.data("productId");
    let recommendationsSectionUrl =
      baseUrl +
      "?section_id=product-recommendations&product_id=" +
      productId +
      "&limit=4";

    $.get(recommendationsSectionUrl).then(function (section) {
      var recommendationsMarkup = $(section).html();
      if (recommendationsMarkup.trim() !== "") {
        $(parentSection).html(recommendationsMarkup);
        let sections = new theme.Sections();
        sections.register("product-carousel", theme.ProductCarousel);
      }
    });
  }

  return ProductRecommendations;
})();

theme.Maps = (function () {
  var config = {
    zoom: 14,
  };
  var apiStatus = null;
  var mapsToLoad = [];

  var errors = {
    addressNoResults: theme.strings.addressNoResults,
    addressQueryLimit: theme.strings.addressQueryLimit,
    addressError: theme.strings.addressError,
    authError: theme.strings.authError,
  };

  var selectors = {
    section: '[data-section-type="map"]',
    map: "[data-map]",
    mapOverlay: "[data-map-overlay]",
  };

  var classes = {
    mapError: "map-section--load-error",
    errorMsg: "map-section__error errors text-center",
  };

  // Global function called by Google on auth errors.
  // Show an auto error message on all map instances.
  // eslint-disable-next-line camelcase, no-unused-vars
  window.gm_authFailure = function () {
    if (!Shopify.designMode) return;

    if (Shopify.designMode) {
      $(selectors.section).addClass(classes.mapError);
      $(selectors.map).remove();
      $(selectors.mapOverlay).after(
        '<div class="' +
          classes.errorMsg +
          '">' +
          theme.strings.authError +
          "</div>"
      );
    }
  };

  function Map(container) {
    this.$container = $(container);
    this.$map = this.$container.find(selectors.map);
    this.key = this.$map.data("api-key");

    if (typeof this.key !== "string" || this.key === "") {
      return;
    }

    if (apiStatus === "loaded") {
      var self = this;

      // Check if the script has previously been loaded with this key
      var $script = $('script[src*="' + this.key + '&"]');
      if ($script.length === 0) {
        $.getScript(
          "https://maps.googleapis.com/maps/api/js?key=" + this.key
        ).then(function () {
          apiStatus = "loaded";
          self.createMap();
        });
      } else {
        this.createMap();
      }
    } else {
      mapsToLoad.push(this);

      if (apiStatus !== "loading") {
        apiStatus = "loading";
        if (typeof window.google === "undefined") {
          $.getScript(
            "https://maps.googleapis.com/maps/api/js?key=" + this.key
          ).then(function () {
            apiStatus = "loaded";
            initAllMaps();
          });
        }
      }
    }
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function (index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data("address-setting");

    geocoder.geocode({ address: address }, function (results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = _.assignIn({}, Map.prototype, {
    createMap: function () {
      var $map = this.$map;

      return geolocate($map)
        .then(
          function (results) {
            var mapOptions = {
              zoom: config.zoom,
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true,
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            //eslint-disable-next-line no-unused-vars
            var marker = new google.maps.Marker({
              map: map,
              position: map.getCenter(),
            });

            google.maps.event.addDomListener(window, "resize", function () {
              google.maps.event.trigger(map, "resize");
              map.setCenter(center);
              $map.removeAttr("style");
            });
          }.bind(this)
        )
        .fail(function () {
          var errorMessage;

          switch (status) {
            case "ZERO_RESULTS":
              errorMessage = errors.addressNoResults;
              break;
            case "OVER_QUERY_LIMIT":
              errorMessage = errors.addressQueryLimit;
              break;
            case "REQUEST_DENIED":
              errorMessage = errors.authError;
              break;
            default:
              errorMessage = errors.addressError;
              break;
          }

          // Show errors only to merchant in the editor.
          if (Shopify.designMode) {
            $map
              .parent()
              .addClass(classes.mapError)
              .html(
                '<div class="' +
                  classes.errorMsg +
                  '">' +
                  errorMessage +
                  "</div>"
              );
          }
        });
    },

    onUnload: function () {
      if (this.$map.length === 0) {
        return;
      }
      google.maps.event.clearListeners(this.map, "resize");
    },
  });

  return Map;
})();

window.theme = window.theme || {};

theme.Search = (function () {
  function Search() {
    theme.equalHeights();
  }

  return Search;
})();

window.theme = window.theme || {};

var selectors = {
  disclosureLocale: "[data-disclosure-locale]",
  disclosureCurrency: "[data-disclosure-currency]",
};

theme.FooterSection = (function () {
  function Footer(container) {
    this.$container = $(container);
    this.cache = {};
    this.cacheSelectors();

    if (this.cache.$localeDisclosure.length) {
      this.localeDisclosure = new theme.Disclosure(
        this.cache.$localeDisclosure
      );
    }

    if (this.cache.$currencyDisclosure.length) {
      this.currencyDisclosure = new theme.Disclosure(
        this.cache.$currencyDisclosure
      );
    }
  }

  Footer.prototype = _.assignIn({}, Footer.prototype, {
    cacheSelectors: function () {
      this.cache = {
        $localeDisclosure: this.$container.find(selectors.disclosureLocale),
        $currencyDisclosure: this.$container.find(selectors.disclosureCurrency),
      };
    },

    onUnload: function () {
      if (this.cache.$localeDisclosure.length) {
        this.localeDisclosure.unload();
      }

      if (this.cache.$currencyDisclosure.length) {
        this.currencyDisclosure.unload();
      }
    },
  });

  return Footer;
})();

theme.variables = {
  productPageLoad: false,
  productPageSticky: true,

  // Breakpoints from src/stylesheets/global/variables.scss.liquid
  mediaQuerySmall: "screen and (max-width: 768px)",
  mediaQueryMedium: "screen and (min-width: 591px) and (max-width: 768px)",
  mediaQueryMediumUp: "screen and (min-width: 591px)",
  mediaQueryLarge: "screen and (min-width: 769px)",
  bpSmall: false,

  magnificPopupZoomSettings: {
    // type: 'image',
    mainClass: "mfp-fade",
    closeOnBgClick: true,
    closeBtnInside: false,
    closeOnContentClick: true,
    tClose: theme.strings.zoomClose,
    removalDelay: 500,
    gallery: {
      enabled: true,
      navigateByImgClick: false,
      arrowMarkup:
        '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"><span class="mfp-chevron mfp-chevron-%dir%"></span></button>',
      tPrev: theme.strings.zoomPrev,
      tNext: theme.strings.zoomNext,
    },
  },
};

theme.initCache = function () {
  theme.cache = {
    $window: $(window),
    $html: $("html"),
    $body: $("body"),
    $drawerRight: $(".drawer--right"),

    $hero: $("#Hero"),
    $customSelect: $(".js-selector"),

    $collectionImage: $(".collection-hero__image"),

    $siteHeaderWrapper: $(".header-wrapper"),
    $siteHeaderPlaceholder: $(".header-placeholder"),
    $siteHeader: $(".site-header"),
    $siteNav: $(".site-nav"),
    $siteLogoWrapper: $(".site-header-logo-wrapper"),
    $siteNavOpen: $(".site-nav--open"),
    $cartBuggle: $(".cart-link__bubble"),
    $logoWrapper: $(".site-header__logo"),
    $logo: $(".site-header__logo img"),
    $toggleSearchModal: $(".js-toggle-search-modal"),
    $searchBox: $(".site-nav--search__bar"),

    $indentedRteImages: $(".rte--indented-images"),

    $productGridRows: $(".collage-grid__row"),
    $productGridPhotosLarge: $(".grid__item--large .grid-product__image-link"),

    // Equal height elements
    $productGridImages: $(".grid-uniform .grid-product__image-wrapper"),

    $returnLink: $(".return-link"),
  };
};

theme.init = function () {
  theme.initCache();
  theme.setBreakpoints();
  theme.fitNav();
  theme.cartInit();
  theme.afterCartLoad();
  theme.checkoutIndicator();
  theme.returnLink();
  theme.styleTextLinks();
  theme.searchModal();
  theme.productCardImageLoadingAnimation();

  // Functions to run on load so image sizes can be calculated
  theme.cache.$window.on("load", theme.resizeLogo);
  theme.cache.$window.on("load", theme.articleImages);

  // Functions to re-run on resize
  theme.cache.$window.on("resize", theme.debounce(theme.resizeLogo, 150));
};

theme.returnLink = function () {
  if (
    !document.referrer ||
    !theme.cache.$returnLink.length ||
    !window.history.length
  ) {
    return;
  }

  theme.cache.$returnLink.on("click", theme.backButton);
};

theme.backButton = function () {
  var referrerDomain = urlDomain(document.referrer);
  var shopDomain = urlDomain(document.url);

  if (shopDomain === referrerDomain) {
    history.back();
    return false;
  }

  function urlDomain(url) {
    var a = document.createElement("a");
    a.href = url;
    return a.hostname;
  }
};

theme.setBreakpoints = function () {
  enquire.register(theme.variables.mediaQuerySmall, {
    match: function () {
      if (theme.settings.gridType === "collage") {
        theme.clearCollageGridHeights();
      }

      theme.variables.bpSmall = true;
    },
    unmatch: function () {
      theme.variables.bpSmall = false;
    },
  });
};

theme.fitNav = function () {
  // Measure children of site nav on load and resize.
  // If wider than parent, switch to mobile nav.
  controlNav();
  theme.cache.$window.on("load", controlNav);
  theme.cache.$window.on("resize", theme.debounce(controlNav, 150));

  function controlNav() {
    if (window.innerWidth < 768) {
      theme.cache.$siteNav.addClass("site-nav--compress");
      theme.cache.$siteNavOpen.addClass("site-nav--open__display");
      theme.cache.$logoWrapper
        .removeClass("large--left")
        .addClass("text-center");
      theme.cache.$searchBox.hide();
    } else {
      theme.cache.$siteNav.removeClass("site-nav--compress");
      theme.cache.$siteNavOpen.removeClass("site-nav--open__display");
      theme.cache.$siteNavOpen.parent().addClass("large--hide");
      theme.cache.$searchBox.show();
    }

    if (window.innerWidth < 1076 && window.innerWidth > 768) {
      theme.cache.$siteLogoWrapper.insertBefore(".site-header-main");
    } else {
      theme.cache.$siteLogoWrapper.insertBefore("#nav-left");
    }

    theme.cache.$siteHeaderPlaceholder.height(
      theme.cache.$siteHeaderWrapper.height()
    );

    theme.cache.$siteNav.addClass("site-nav--init");
    theme.cache.$siteNavOpen.addClass("site-nav--init");
  }
};

theme.resizeLogo = function () {
  // Using .each() as there can be a reversed logo too
  theme.cache.$logo.each(function () {
    var $el = $(this),
      logoWidthOnScreen = $el.width(),
      containerWidth = $el.closest(".grid__item").width();
    // If image exceeds container, let's make it smaller
    if (logoWidthOnScreen > containerWidth) {
      $el.css("maxWidth", containerWidth);
    } else {
      $el.removeAttr("style");
    }
  });
};

theme.sizeCartDrawerFooter = function () {
  // Stop if our drawer doesn't have a fixed footer
  if (!theme.cache.$drawerRight.hasClass("drawer--has-fixed-footer")) {
    return;
  }

  // Elements are reprinted regularly so selectors are not cached
  var cartDrawerTitleHeight = $(".drawer--right .drawer__header").outerHeight();
  var $cartDrawerInner = $(".drawer--right .drawer__inner");

  if (cartDrawerTitleHeight != 80) {
    $cartDrawerInner.css("top", cartDrawerTitleHeight);
  }
};

theme.afterCartLoad = function () {
  theme.cache.$body.on("ajaxCart.afterCartLoad", function (evt, cart) {
    // Open cart drawer
    timber.RightDrawer.open();

    // Size the cart's fixed footer
    theme.sizeCartDrawerFooter();

    // Show cart bubble in nav if items exist
    if (cart.items.length > 0) {
      theme.cache.$cartBuggle.addClass("cart-link__bubble--visible");
    } else {
      theme.cache.$cartBuggle.removeClass("cart-link__bubble--visible");
    }
  });
};

theme.checkoutIndicator = function () {
  // Add a loading indicator on the cart checkout button (/cart and drawer)
  theme.cache.$body.on(
    "click",
    ".cart__checkout, .cart-sidebar__btn",
    function () {
      $(this).addClass("btn--loading");
    }
  );
};

theme.searchModal = function () {
  if (!theme.cache.$toggleSearchModal.length) {
    return;
  }

  theme.cache.$toggleSearchModal.magnificPopup({
    type: "inline",
    mainClass: "mfp-fade",
    closeOnBgClick: true,
    closeBtnInside: false,
    closeOnContentClick: false,
    tClose: theme.strings.zoomClose,
    alignTop: true,
    removalDelay: 500,
    focus: ".search-bar > input",
  });
};

theme.clearCollageGridHeights = function () {
  if (!theme.cache.$productGridRows.length) {
    return;
  }

  theme.cache.$productGridPhotosLarge.removeAttr("style");
};

theme.articleImages = function () {
  if (!theme.cache.$indentedRteImages.length) {
    return;
  }

  theme.cache.$indentedRteImages.find("img").each(function () {
    var $el = $(this);
    var attr = $el.attr("style");

    // Check if undefined or float: none
    if (!attr || attr == "float: none;") {
      // Remove grid-breaking styles if image isn't wider than parent
      if ($el.width() < theme.cache.$indentedRteImages.width()) {
        $el.addClass("rte__no-indent");
      }
    }
  });
};

theme.styleTextLinks = function () {
  $(".rte").find("a:not(:has(img))").addClass("text-link");
};

theme.equalHeights = function () {
  var self = this;
  theme.cache.$window.on("load", resizeElements());

  theme.cache.$window.on(
    "resize",
    afterResize(
      function () {
        resizeElements();
      },
      250,
      "equal-heights"
    )
  );

  function resizeElements() {
    self.cache.$productGridImages.css("height", "auto").equalHeights();
  }
};

theme.cartInit = function () {
  if (!theme.cookiesEnabled()) {
    theme.cache.$body.addClass("cart--no-cookies");
  }
};

theme.cookiesEnabled = function () {
  var cookieEnabled = navigator.cookieEnabled;

  if (!cookieEnabled) {
    document.cookie = "testcookie";
    cookieEnabled = document.cookie.indexOf("testcookie") !== -1;
  }
  return cookieEnabled;
};

theme.productCardImageLoadingAnimation = function () {
  var selectors = {
    image: "[data-image]",
    imageLink: "[data-image-link]",
  };

  var classes = {
    loadingAnimation: "grid-product__image-link--loading",
    lazyloaded: ".lazyloaded",
  };

  $(document).on("lazyloaded", function (e) {
    var $target = $(e.target);

    if (!$target.is(selectors.image)) {
      return;
    }

    $target.closest(selectors.imageLink).removeClass(classes.loadingAnimation);
  });

  // When the theme loads, lazysizes might load images before the "lazyloaded"
  // event listener has been attached. When this happens, the following function
  // hides the loading placeholders.
  $(selectors.image + classes.lazyloaded)
    .closest(selectors.imageLink)
    .removeClass(classes.loadingAnimation);
};

theme.updateSlickSwipe = function (element, allowSwipe) {
  if (!element.hasClass("slick-initialized")) {
    return;
  }

  var slickOptions = {
    accessibility: allowSwipe,
    draggable: allowSwipe,
    swipe: allowSwipe,
    touchMove: allowSwipe,
  };
  element.slick("slickSetOption", slickOptions, false);
};

$(document).ready(function () {
  theme.init();
  var sections = new theme.Sections();

  sections.register("product-template", theme.Product);
  sections.register("collection-template", theme.Collection);
  sections.register("header-section", theme.HeaderSection);
  sections.register("featured-content-section", theme.FeaturedContentSection);
  sections.register("newsletter-section", theme.NewsletterSection);
  sections.register("slideshow-section", theme.SlideshowSection);
  sections.register("product-carousel", theme.ProductCarousel);
  sections.register("sock-height-carousel", theme.SockHeightCarousel);
  sections.register("sock-category-carousel", theme.SockCategoryCarousel);
  sections.register("quote-carousel", theme.QuoteCarousel);
  sections.register("password-header", theme.PasswordHeader);
  sections.register("password-content", theme.PasswordContent);
  sections.register("product-recommendations", theme.ProductRecommendations);
  sections.register("map", theme.Maps);
  sections.register("search", theme.Search);
  sections.register("footer-section", theme.FooterSection);

  if (!window.location.host.includes("dev")) {
    //"Earn Free Socks" floating button fixed to the bottom of the site by a 3rd-party app
    //need this JS to wrap it in a div so we can control it's z-index
    var checkForEarnFreeSockFloatingBtn = function () {
      var earnFreeSocksFloatingBtn = document.querySelector(
        "#smile-ui-container"
      );
      if (earnFreeSocksFloatingBtn) {
        var $earnFreeSocksFloatingBtn = $("#smile-ui-container");
        //$earnFreeSocksFloatingBtn.wrap( "<div class='earn-free-socks-floating-btn-wrapper'></div>" );
      } else {
        setTimeout(function () {
          checkForEarnFreeSockFloatingBtn();
        }, 500);
      }
    };
    checkForEarnFreeSockFloatingBtn();

    //"help" floating button fixed to the bottom of the site by a 3rd-party app
    //need this JS to control it's z-index
    var checkForHelpFloatingBtn = function () {
      var helpFloatingBtn = document.querySelector("iframe#launcher");
      if (helpFloatingBtn) {
        var $helpFloatingBtn = $("iframe#launcher");
        $helpFloatingBtn.parent().addClass("help-floating-btn-wrapper");
      } else {
        setTimeout(function () {
          checkForHelpFloatingBtn();
        }, 500);
      }
    };
    checkForHelpFloatingBtn();
  }

  // cart page functionality
  if ($(".template-cart ").length) {
    $(".cart .js-qty__adjust").on("click", function () {
      submitCartForm($(this));
    });
    var qtyValOnFocusIn;
    $(".cart .js-qty__num").on("focusin", function () {
      qtyValOnFocusIn = $(this).val();
    });
    $(".cart .js-qty__num").on("focusout", function () {
      if (qtyValOnFocusIn != $(this).val()) {
        submitCartForm($(this));
      }
      qtyValOnFocusIn = null;
    });
    var submitCartForm = function ($qtyElement) {
      var form = $qtyElement.parents("form");
      form.submit();
    };
  }

  //init product card JS functionality if any element on the page has a data-attribue of data-product-cards-by-collection
  if ($("[data-product-cards-by-collection]").length) {
    initJsProductCards(
      $("[data-product-cards-by-collection]").attr(
        "data-product-cards-by-collection"
      )
    );
  }

  //init select-nav functionality if any element on the page has a class of js-select-nav
  if ($(".js-select-nav").length) {
    $(".js-select-nav").change(function () {
      window.location = $(this).find("option:selected").val();
    });
  }

  //init accordion functionality if any element on the page has a class of "accordion" (intended for FAQ page, can be reused)
  if ($(".accordion ").length) {
    var allPanels = $(".accordion > dd").hide();
    var allPanelHeaders = $(".accordion > dt");

    $(".accordion > dt").click(function (e) {
      $targetPanel = $(this).next();
      $targetHeader = $(this);

      if (!$targetPanel.hasClass("active")) {
        allPanels.removeClass("active").slideUp();
        $targetPanel.addClass("active").slideDown();
        allPanelHeaders.removeClass("active");
        $targetHeader.addClass("active");
      } else {
        allPanels.removeClass("active").slideUp();
        allPanelHeaders.removeClass("active");
      }

      return false;
    });
  }

  // init new PDP Accordions

  if ($(".product-single__accordion-title").length) {
    var acc = document.getElementsByClassName(
      "product-single__accordion-title"
    );
    var i;

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function () {
        this.classList.toggle("active");
        // change + to -
        var span = this.getElementsByTagName("span")[0];
        if (span.classList.contains("accordion-plus")) {
          span.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="17.996" height="2" viewBox="0 0 17.996 2"><g transform="translate(1 1)"><path d="M0,17a1,1,0,0,1-1-1V0A1,1,0,0,1,0-1,1,1,0,0,1,1,0V16A1,1,0,0,1,0,17Z" transform="translate(15.996) rotate(90)"/></g></svg>';
          span.classList.toggle("accordion-plus");
        } else {
          span.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="17.996" height="17.996" viewBox="0 0 17.996 17.996"><g transform="translate(-1751.504 -1172.5)"><path d="M0,17a1,1,0,0,1-1-1V0A1,1,0,0,1,0-1,1,1,0,0,1,1,0V16A1,1,0,0,1,0,17Z" transform="translate(1760.502 1173.5)"/><path d="M0,17a1,1,0,0,1-1-1V0A1,1,0,0,1,0-1,1,1,0,0,1,1,0V16A1,1,0,0,1,0,17Z" transform="translate(1768.5 1181.498) rotate(90)"/></g></svg>';
          span.classList.toggle("accordion-plus");
        }
        var panel = this.nextElementSibling;
        panel.classList.toggle("active");
      });
    }
  }

  // //init functionality for "Feetures Product Lines" section
  if ($(".feeturesProductLines ").length) {
    $(".feeturesProductLines__nav .btn").on("click", function () {
      $(this).addClass("active");
      $(this).siblings().removeClass("active");
      var theProductLine = $(this).text();
      $(".productLineDetails[data-name='" + theProductLine + "']").addClass(
        "productLineDetails--active"
      );
      $(".productLineDetails[data-name='" + theProductLine + "']")
        .siblings()
        .removeClass("productLineDetails--active");
    });
    if (theme.variables.bpSmall) {
      $(".feeturesProductLines__nav").slick({
        dots: false,
        arrows: false,
        draggable: true,
        infinite: false,
        slidesToShow: 1,
        centerMode: false,
        variableWidth: true,
      });
    }
  }
});

var countVariantSelectorsThatArentColorDuplicates = function () {
  $(".grid-product__variants").each(function () {
    var variantSelectorNotColorDuplicate = $(this).find(
      $(".variant-selector:not(.variant-selector--color-duplicate)")
    );
    variantSelectorNotColorDuplicate.each(function (index) {
      $(this).addClass("variant-selector--not-color-duplicate-" + (index + 1));
    });
  });
};

var initJsProductCards = function (collectionHandle) {
  var apiURL;
  if (window.location.host.includes("dev")) {
    apiURL =
      "https://api.feetures.com/dev/product/variant/?collection=" +
      collectionHandle;
  } else {
    apiURL =
      "https://api.feetures.com/prod/product/variant/?collection=" +
      collectionHandle;
  }

  var params = {
    type: "GET",
    url: apiURL,
    success: function (response) {
      var collectionItemsFromAPI = JSON.parse(response);
      $.each(collectionItemsFromAPI, function () {
        var theProductHandle = this.handle;
        var $product = $("[data-product-id=" + this.id + "]");
        $productVariantSection = $product.find(".grid-product__variants");
        $productSaleMsgSection = $product.find(".grid-product__sale-msg");
        $productImgWrapperSection = $product.find(
          ".grid-product__image-wrapper"
        );

        var allVariantsAreOnSale = true;
        var newColors = false;
        var colorList = [];
        var colorListIncludingParentColors = [];
        $.each(this.variants, function (index, value) {
          newDiv = $("<div class='variant-selector'></div>");
          newDiv.attr("data-variant-id", this.id);
          newDiv.attr("data-variant-price", this.price);
          var positionOfFileExtention = this.image.indexOf(".jpg");
          if (positionOfFileExtention == -1) {
            positionOfFileExtention = this.image.indexOf(".jpeg");
          }
          if (positionOfFileExtention == -1) {
            positionOfFileExtention = this.image.indexOf(".png");
          }
          var imageWidth = "_389x";
          var imageResized = [
            this.image.slice(0, positionOfFileExtention),
            imageWidth,
            this.image.slice(positionOfFileExtention),
          ].join("");

          newDiv.attr("data-variant-image", imageResized);

          if (this.compareAtPrice) {
            newDiv.attr("data-variant-compare-at-price", this.compareAtPrice);
          } else {
            allVariantsAreOnSale = false;
          }

          if (this.new) {
            newDiv.attr("data-variant-new", "true");
            newColors = true;
          }
          if (this.exclusively_men) {
            newDiv.attr("data-variant-exclusively-men", "true");
          }
          if (this.exclusively_women) {
            newDiv.attr("data-variant-exclusively-women", "true");
          }

          var colorsArrayFilterFriendly = false;

          if (this.parent_colors) {
            colorsArrayFilterFriendly = this.parent_colors;
            $.each(colorsArrayFilterFriendly, function (i, val) {
              if (jQuery.inArray(val, colorListIncludingParentColors) == -1) {
                colorListIncludingParentColors.push(val);
              }
            });
          }

          var hoverImg;
          //hover image is the 3rd variant image, as long as there are 3 images
          if (this.images.length >= 3) {
            hoverImg = this.images[2].originalSrc;
            //if there are only 2 variant image, the 2nd is the hover image
          } else if (this.images.length == 2) {
            hoverImg = this.images[1].originalSrc;
          }
          //loop thru variant images
          $.each(this.images, function (index) {
            //if any of the variant images contain "hover|" in it's alt text, thats the hover image
            if (this.altText.toLowerCase().includes("hover|")) {
              hoverImg = this.originalSrc;
            }
          });
          if (hoverImg) {
            var positionOfFileExtention = hoverImg.indexOf(".jpg");
            if (positionOfFileExtention == -1) {
              positionOfFileExtention = hoverImg.indexOf(".jpeg");
            }
            if (positionOfFileExtention == -1) {
              positionOfFileExtention = hoverImg.indexOf(".png");
            }
            var hoverImageResized = [
              hoverImg.slice(0, positionOfFileExtention),
              imageWidth,
              hoverImg.slice(positionOfFileExtention),
            ].join("");
            newDiv.attr("data-variant-hover-image", hoverImageResized);
          }

          //loop thru variant options (size and color)
          $.each(this.options, function (index) {
            if (this.name.toLowerCase().includes("color")) {
              newDiv.attr("data-variant-color", this.value);
              var assetName =
                "swatch-" +
                this.value.replace(/\s+/g, "-").toLowerCase() +
                ".png";
              var aLiquidAsset = "//feetures.com/cdn/shop/t/204/assets/swatch-black.png?v=164837564979573904781675096024";
              var liquidAssetPath = aLiquidAsset.substr(
                0,
                aLiquidAsset.lastIndexOf("/") + 1
              );
              newDiv.html(
                "<img src='" +
                  liquidAssetPath +
                  assetName +
                  "' alt='" +
                  this.value +
                  "'>"
              );
              if (jQuery.inArray(this.value, colorList) == -1) {
                colorList.push(this.value);
              } else {
                //color was already added
                //(there are multiple instances of each color because there is a color for each size, but we only want to display 1 color swatch per product)
                newDiv.addClass("variant-selector--color-duplicate");
              }

              //add any color that doesn't have a parent-color to the colorListIncludingParentColors array
              if (!colorsArrayFilterFriendly) {
                colorsArrayFilterFriendly = [this.value];
                if (
                  jQuery.inArray(this.value, colorListIncludingParentColors) ==
                  -1
                ) {
                  colorListIncludingParentColors.push(this.value);
                }
              }
            }

            if (this.name.toLowerCase().includes("size")) {
              newDiv.attr("data-variant-size", this.value);
            }

            newDiv.attr(
              "data-variant-color-filter-friendly",
              colorsArrayFilterFriendly
            );
          });

          $productVariantSection.append(newDiv);
        });

        //on mobile, we only display 4 swatches followed by a "+X" to denote that there are more colors
        if (colorList.length > 4) {
          var newDiv = $("<div class='variant-selector-extra-count'></div>");
          newDiv.text("+" + (colorList.length - 4));
          $productVariantSection.append(newDiv);
        }

        $product.attr(
          "data-all-colors-filter-friendly",
          colorListIncludingParentColors
        );

        if (allVariantsAreOnSale) {
          if (!$productSaleMsgSection.text().includes("Bundle")) {
            $productSaleMsgSection.text("Sale");
          }
        }

        if (newColors) {
          $productImgWrapperSection.find($(".grid-product__on-sale")).remove();
          var badgeDiv = $(
            "<div class='grid-product__badge'><p>New Colors</p></div>"
          );
          $productImgWrapperSection.append(badgeDiv);
        }

        $("[data-product-id]").each(function (index) {
          $(this).find(".variant-selector:first-child").click();
        });
      });

      $("body").removeClass("collections-loading");
      $("body").addClass("collections-loaded");

      countVariantSelectorsThatArentColorDuplicates();
    },
    error: function (XMLHttpRequest, textStatus) {
      console.log("ERROR");
    },
  };
  jQuery.ajax(params);
  productCardFunctionality();
};

var productCardFunctionality = function () {
  countVariantSelectorsThatArentColorDuplicates();

  //clicking on variant-selector functionality:
  $(document).on("click", ".variant-selector", function () {
    var $parentCard = $(this).closest(".grid-product__wrapper");
    $(this).addClass("variant-selector--selected");
    $(this).siblings().removeClass("variant-selector--selected");

    $parentCard
      .find(".grid__price-actual")
      .text("$" + Number($(this).data("variantPrice")).toFixed(2));
    $parentCard
      .find(".product--image")
      .attr("src", $(this).data("variantImage"));

    //clear the "original-img" data attr, which is created on-hover.
    if ($parentCard.attr("data-original-img")) {
      $parentCard.removeAttr("data-original-img");
    }

    var selectedSize = $(this).data("variantSize");
    var selectedColor = $(this).data("variantColor");

    $parentCard.find(".grid-product-size").removeAttr("data-id");
    $parentCard.find(".grid-product-size").removeAttr("data-qty");
    $parentCard
      .find("[data-size=" + selectedSize.toLowerCase() + "]")
      .attr("data-id", $(this).data("variantId"));
    $parentCard
      .find("[data-size=" + selectedSize.toLowerCase() + "]")
      .attr("data-qty", $(this).data("variantQty"));
    $(this)
      .siblings()
      .each(function (index) {
        if ($(this).data("variantColor") == selectedColor) {
          $parentCard
            .find(
              "[data-size=" + $(this).data("variantSize").toLowerCase() + "]"
            )
            .attr("data-id", $(this).data("variantId"));
          $parentCard
            .find(
              "[data-size=" + $(this).data("variantSize").toLowerCase() + "]"
            )
            .attr("data-qty", $(this).data("variantQty"));
        }
      });

    if ($(this).data("variantCompareAtPrice")) {
      $parentCard
        .find(".grid__price-compare")
        .text("$" + Number($(this).data("variantCompareAtPrice")).toFixed(2));
    } else {
      $parentCard.find(".grid__price-compare").text("");
    }

    if ($(this).data("variantHoverImage")) {
      $parentCard
        .parent("[data-product-id]")
        .attr("data-hover-image", $(this).data("variantHoverImage"));

      //preload the hover image
      var img = new Image();
      img.src = $(this).data("variantHoverImage");
    }

    const imageWrapper = this.closest(".grid-product__wrapper").querySelector(
      ".grid-product__image-wrapper"
    );
    $(imageWrapper).find(".grid-product__badge--new").remove();
    if (
      selectedColor &&
      this.closest(".grid-product__variants").querySelector(
        `[data-variant-color="${selectedColor}"][data-variant-new-style="true"]`
      )
    ) {
      imageWrapper.innerHTML =
        imageWrapper.innerHTML +
        '<div class="grid-product__badge grid-product__badge--new"><p>New!</p></div>';
    }
  });

  //hovering over product card image functionality:
  $(document).on(
    {
      mouseenter: function () {
        let parentCard = $(this).closest("[data-product-id]");
        if (parentCard.attr("data-hover-image")) {
          parentCard
            .find(".product--image")
            .attr("src", parentCard.attr("data-hover-image"));
        }
      },
      mouseleave: function () {
        let parentCard = $(this).closest("[data-product-id]");
        if (parentCard.attr("data-hover-image")) {
          let selectedVariantImage = parentCard
            .find(".variant-selector--selected")
            .attr("data-variant-image");
          parentCard.find(".product--image").attr("src", selectedVariantImage);
        }
      },
    },
    ".grid-product__image-wrapper"
  );

  //hovering over variant-selector functionality:
  $(document).on(
    {
      mouseenter: function () {
        let parentCard = $(this).closest("[data-product-id]");
        parentCard
          .find(".product--image")
          .attr("src", $(this).attr("data-variant-image"));
      },
      mouseleave: function () {
        let parentCard = $(this).closest("[data-product-id]");
        let selectedVariantImage = parentCard
          .find(".variant-selector--selected")
          .attr("data-variant-image");
        parentCard.find(".product--image").attr("src", selectedVariantImage);
      },
    },
    ".variant-selector"
  );

  //on-click of a size functionality: add that size to user's cart
  $(document).on("click", ".grid-product-size", function () {
    var theId = $(this).get(0).dataset.id;
    var theData = JSON.stringify({ items: [{ quantity: 1, id: theId }] });

    fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: theData,
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        $(".js-drawer-open-button-right").click();
      });
  });
};

/*
 * Run function after window resize
 * http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed
 */
var afterResize = (function () {
  var t = {};
  return function (callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (t[uniqueId]) {
      clearTimeout(t[uniqueId]);
    }
    t[uniqueId] = setTimeout(callback, ms);
  };
})();

// theme.GeoLocation = (function() {

//   function init() {
//       _ipgeolocation.enableSessionStorage(true);
//       var ip = sessionStorage.getItem("ip"),
//           country = sessionStorage.getItem("country_code2");

//       if (!ip || !country) {
//           _ipgeolocation.makeAsyncCallsToAPI(false);
//           _ipgeolocation.setFields("country_code2");
//           _ipgeolocation.getGeolocation(handleGeoResponse, "d68b037dc3924bf091c17be3eb89ffce");
//       }

//   }

//   function isEu(country) {
//       var eu_redirected_countries = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","GB"];
//       return eu_redirected_countries.indexOf(country) > -1;
//   }

//   function handleGeoResponse(json) {
//       ip = json.ip;
//       country = json.country_code2;
//   }

//   function getCountry() {
//       return country;
//   }

//   return {
//       init: init,
//       country: getCountry,
//       isEu: isEu
//   };
// })();
// theme.GeoLocation.init();

/**Element.matches() polyfill (simple version),  https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill*/
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

// //START: COOKIE BANNER, ONLY DISPLAYED FOR EU VISITORS
// var cookieBanner = document.querySelector(".cookieBanner")
// var country = theme.GeoLocation.country()
// var isEU = theme.GeoLocation.isEu(country)
// if (isEU) {
//   cookieBanner.classList.add("cookieBanner--show")
// 	if (document.cookie.split(';').some(function(item) {
// 		return item.trim().indexOf('cookieBannerWasClicked=') == 0
// 	})) {
// 		cookieBanner.remove()
// 	} else {
// 		document.addEventListener('click', function (event) {
// 			if (!event.target.matches(".cookieBanner__btn")) return;
// 			cookieBanner.remove()
// 			document.cookie = "cookieBannerWasClicked=true;"
// 		}, false);
// 	}
// } else {
// 	cookieBanner.remove()
// }
//END: COOKIE BANNER, ONLY DISPLAYED FOR EU VISITORS
