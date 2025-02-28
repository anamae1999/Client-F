const collectionApp = Vue.createApp({
  el: '#collectionApp',
  data() {
      return {
          subCollectionHandles: window.subCollectionHandles !== 'undefined' ? window.subCollectionHandles : [],
          subCollectionBanners: window.subCollectionBanners !== 'undefined' ? window.subCollectionBanners : {},
          collectionHandle: window.collectionHandle || '',
          products: [],
          filteredProducts: [],
          filterOptions: {
              'sizes': {},
              'height': {},
              'cushion': {},
              'colors': {},
              'collection': {}
          },
          selectedFilters: {
              'sizes': [],
              'height': [],
              'cushion': [],
              'colors': [],
              'collection': []
          },
          sortOptions: {},
          globalColorList: [],
          isLoaded: false,
          errorOccured: false,
          colors: ['black','brown','tan','gray','pink','red','yellow','blue','green','purple','orange','white'],
          isFiltered: false,
          noResultsFoundCopy: "No Results Found",
          errorCopy: "Sorry, an error occured. Please reload the page."
      }
  },
  computed: {
      apiUrl() {
          if( window.location.host.includes('dev') ) {
              return "https://api.feetures.com/dev/product/variant/?collection="
          } else {
              return "https://api.feetures.com/prod/product/variant/?collection="
          }
      },
      itemsCount() {
          let html = '';
          if(this.isLoaded) {
              if(this.filteredProducts.length === 1) {
                  html = '<span class="collection-item-count">1</span> Item';
              } else {
                  html = '<span class="collection-item-count">'+this.filteredProducts.length+'</span> Items';
              }
          }
          return html;
      },
      someFiltersSelected() {
          return this.countFiltersSelected ? true : false;
      },
      countFiltersSelected() {
          let selected = 0;
          for(let filter in this.selectedFilters) {
              if(this.selectedFilters.hasOwnProperty(filter) && this.selectedFilters[filter].length > 0){
                  selected += this.selectedFilters[filter].length;
              }
          }
          if(selected > 0) {
              this.isFiltered = true;
              return '(' + selected + ')';
          } else {
              this.isFiltered = false;
              return '';
          }
      }
  },
  created () {
      var vm = this
      if( this.subCollectionHandles ) {
          // for collection pages that have subcollections, we DONT hit the api for the collection page we are on,
          // instead, we hit the api multiple times, once for each subcollection (so that we make multiple small API call instead of 1 big one, to avoid timeout)
          var theApiUrl = this.apiUrl
          var objectOfFunctionsToHitApi = {}
          var arrayOfPromises = []
          this.subCollectionHandles.forEach((handle, index) => {
              objectOfFunctionsToHitApi[index] = function() {
                  return axios.get(theApiUrl+handle);
              }
              arrayOfPromises.push(objectOfFunctionsToHitApi[index].call())
          })
          Promise.all(arrayOfPromises)
          .then(function (response) {
              var arrayOfArraysToConcat = []
              response.forEach((item, index) => { 
                  arrayOfArraysToConcat.push(item.data)
              })
              var resultArray = Array.prototype.concat.apply([], arrayOfArraysToConcat);
              var filteredResultArray = resultArray.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
              vm.afterAPILoads(filteredResultArray)
          })
          .catch(error => vm.onAPIerror(error));
      } else {
          axios.get(this.apiUrl+this.collectionHandle)
          .then(response => {
              this.afterAPILoads(response.data)
          })
          .catch(error => vm.onAPIerror(error));
      }
  },
  methods: {
      afterAPILoads(arrayOfProductsDataReturnedFromApi) {
          let result = [];
          arrayOfProductsDataReturnedFromApi.forEach((product, index) => {
              if(window.collectionSectionProducts.hasOwnProperty(product.id)) {
                  result.push({...window.collectionSectionProducts[product.id],...product});
              }
          });
          result.sort(function(a, b) {
              return parseInt(a.position) - parseInt(b.position);
          });
          this.products = this.processProducts(result);
          this.filteredProducts = this.products;
          this.isLoaded = true;
          this.dispatchCollectionLoaded();
      },
      onAPIerror(error) {
          console.error(error)
          this.errorOccured = true
          this.isLoaded = true
          this.noResultsFoundCopy = ""
      },
      dispatchCollectionLoaded() {
          let event = new Event('collection-loaded');
          setTimeout(function(){ document.dispatchEvent(event); }, 1000);
      },
      dispatchColorSelected(value) {
          let event = new CustomEvent('collection-color-selected', { detail: {
              color: value
          }});
          setTimeout(function(){ document.dispatchEvent(event); }, 1000);
      },
      processProducts(data) {
          let results = [];
          data.forEach((product,index) => {
             console.log(product);
              product.all_variants_onsale = true;
              product.new_color = false;
              product.sizes = [];
              product.colors = [];
              product.height = '';
              product.cushion = '';
              product.collection = '';
              product.colorListIncludingParentColors = [];
              for (let productOption of product.options) {
                  if(productOption.name.toLowerCase().includes('size')) {
                      let sizes = productOption.values.map(function(v) {
                          return v.toLowerCase();
                      });
                      product.sizes = sizes;
                      for (let value of sizes) {
                          if(this.filterOptions['sizes'].hasOwnProperty(value)) {
                              this.filterOptions['sizes'][value] += 1;
                          } else {
                              this.filterOptions['sizes'][value] = 1;
                          }
                      }
                  }
              }
              for (let tag of product.tags) {
                  const productTag = tag.toLowerCase();
                  if(productTag.includes('height:')) {
                      product.height = productTag.replace('height: ','');
                      if(this.filterOptions['height'].hasOwnProperty(product.height)) {
                          this.filterOptions['height'][product.height] += 1;
                      } else {
                          this.filterOptions['height'][product.height] = 1;
                      }
                  }
                  if(productTag.includes('cushion:')) {
                      product.cushion = productTag.replace('cushion: ','');
                      if(this.filterOptions['cushion'].hasOwnProperty(product.cushion)) {
                          this.filterOptions['cushion'][product.cushion] += 1;
                      } else {
                          this.filterOptions['cushion'][product.cushion] = 1;
                      }
                  }
                  if(productTag.includes('type:')) {
                      product.collection = productTag.replace('type: ','');
                      if(this.filterOptions['collection'].hasOwnProperty(product.collection)) {
                          this.filterOptions['collection'][product.collection] += 1;
                      } else {
                          this.filterOptions['collection'][product.collection] = 1;
                      }
                  }
              }
              let variants = product.variants;
              if(typeof variants === 'object') {
                  variants = this.convertToArray(variants);
              }

              variants.some(variant => {
                  if(!variant.compareAtPrice ) {
                      product.all_variants_onsale = false;
                      return true;
                  }
              });
              if(product.all_variants_onsale === true && !product.sale_msg.includes('Bundle')) {
                  product.sale_msg = 'Sale';
              }
              variants.some(variant => {
                  if(variant.new ) {
                      product.new_color = true;
                      return true;
                  }
              });
              variants.forEach(variant => {
                  let colorsArrayFilterFriendly = false;
                  if(variant.hasOwnProperty('parent_colors') && variant.parent_colors) {
                      colorsArrayFilterFriendly = variant.parent_colors
                      colorsArrayFilterFriendly.some(val => {
                          const color = val.toLowerCase();
                          if(product.colorListIncludingParentColors.indexOf(color) === -1 ) {
                              product.colorListIncludingParentColors.push(color);
                          }
                      })
                  }
                  for (let option of variant.options) {
                      if (!colorsArrayFilterFriendly && option.name.toLowerCase().includes('color')) {
                          const color = option.value.toLowerCase();
                          colorsArrayFilterFriendly = [color];
                          if(product.colorListIncludingParentColors.indexOf(color) === -1 ) {
                              product.colorListIncludingParentColors.push(color);
                          }
                      }
                  }
              });
              for (let value of product.colorListIncludingParentColors) {
                  if(this.filterOptions['colors'].hasOwnProperty(value)) {
                      this.filterOptions['colors'][value] += 1;
                  } else {
                      this.filterOptions['colors'][value] = 1;
                  }
              }

              results.push(product);
          });
          return results;
      },
      filterDisabled(filter, value) {
          if(!this.filterOptions.hasOwnProperty(filter)) {
              return true;
          }
          if(!this.filterOptions[filter].hasOwnProperty(value)) {
              return true;
          }
          if(this.filterOptions[filter][value] < 1) {
              return true;
          }
          return false;
      },
      filterSelected(filter, value) {
          if(!this.selectedFilters.hasOwnProperty(filter)) {
              return false;
          }
          if(this.selectedFilters[filter].indexOf(value) < 0) {
              return false;
          }
          return true;
      },
      selectFilter(filter, value) {
          if(this.selectedFilters[filter].indexOf(value) < 0) {
              this.selectedFilters[filter].push(value);
              this.updateProducts(filter, value);
          } else {
              this.deselectFilter(filter, value);
          }
      },
      deselectFilter(filter, value) {
          const index = this.selectedFilters[filter].indexOf(value);
          if(index > -1) {
              this.selectedFilters[filter].splice(index, 1);
          }
          if(filter === 'colors') {
              const lastColor = (this.selectedFilters.colors.length > 0) ? this.selectedFilters.colors[this.selectedFilters.colors.length - 1] : null;
              if(lastColor) {
                  this.updateProducts(filter, lastColor);
              } else {
                  this.updateProducts();
              }
          } else {
              this.updateProducts();
          }
      },
      clearAllFilters() {
          for(let filter in this.selectedFilters) {
              if(this.selectedFilters.hasOwnProperty(filter)) {
                  this.selectedFilters[filter] = [];
              }
          }
          this.updateProducts();
      },
      updateProducts(filter, value) {
          let filtered = this.products;
          filter = (typeof filter === 'undefined') ? false : filter;
          value = (typeof value === 'undefined') ? false : value;
          for(let filter in this.selectedFilters) {
              if(this.selectedFilters.hasOwnProperty(filter) && this.selectedFilters[filter].length > 0) {
                  switch(filter) {
                      case 'sizes':
                          filtered = filtered.filter(product => this.compareArrays(this.selectedFilters[filter],product[filter]).length > 0);
                          break;

                      case 'colors':
                          filtered = filtered.filter(product => this.compareArrays(this.selectedFilters[filter],product.colorListIncludingParentColors).length > 0);
                          break;

                      case 'height':
                      case 'cushion':
                      case 'collection':
                          filtered = filtered.filter(product => this.selectedFilters[filter].indexOf(product[filter]) > -1);
                          break;
                  }
              }
          }
          this.filteredProducts = filtered;
          if(filter === 'colors' && value) {
              this.dispatchColorSelected(value);
          } else {
              this.dispatchCollectionLoaded();
          }
      },
      compareArrays(arr1,arr2) {
          var ret = [];
          for(var i in arr1) {
              if(arr2.indexOf(arr1[i]) > -1){
                  ret.push(arr1[i]);
              }
          }
          return ret;
      },
      convertToArray(obj) {
          return Object.keys(obj).map((key) => obj[key]);
      }
  }
})

collectionApp.component('collection-grid', {
  template: `
  <div class="collectionGrid" v-if="hasProducts">
      <template v-if="hasSubCollections">
          <template v-for="(subCollection, handle) in subCollectionBanners">
              <div class="collectionGrid-item-collection" v-bind:data-handle="handle" v-html="decodeHTML(subCollection)"></div>
              <component-product
                v-for="product in getSubCollectionProducts(handle)" 
                :key="product.id"
                :product="product"
              ></component-product>
          </template>
      </template>
      <template v-else>
          <component-product
            v-for="product in products" 
            :key="product.id"
            :product="product"
          ></component-product>
      </template>
  </div>
  `,
  props: {
      products: Array,
      subCollectionBanners: Object,
      isFiltered: Boolean
  },
  computed: {
      hasProducts: function () {
          return this.products.length;
      },
      hasSubCollections: function () {
          if(this.isFiltered) {
              return false;
          } else {
              return this.subCollectionBanners && Object.keys(this.subCollectionBanners).length > 0;
          }
      }
  },
  methods: {
      decodeHTML: function (html) {
          var txt = document.createElement('textarea');
          txt.innerHTML = html;
          return txt.value;
      },
      getSubCollectionProducts: function (handle) {
          return this.products.filter(product => product.collection_handle.indexOf(handle) !== -1);
      }
  }
})

collectionApp.component('component-product', {
  template: `
<div class="collectionGrid-item-product" :data-all-colors-filter-friendly="product.colorListIncludingParentColors" :data-product-id="product.id" :data-womens-default-color="product.womens_default_color" :data-mens-default-color="product.mens_default_color">      <div class="grid-product__wrapper">
           <div class="grid-product__image-wrapper">
              <a class="grid-product__image-link" v-bind:href="product.url" data-image-link>
                  <img loading="lazy" class="product--image {{ product.img_id_class }}" v-bind:src="product.img_url" data-sizes="auto" v-bind:alt="product.image_alt" data-image>
              </a>
              <div class="grid-product__badge" v-if="product.new_color"><p>New Colors</p></div>
              <div class="grid-product__sold-out" v-else-if="product.sold_out">
                  <p>Sold Out</p>
              </div>
              <div class="grid-product__on-sale" v-else-if="product.on_sale">
                  <p>Sale</p>
              </div>
          </div>
      
          <a v-bind:href="product.url" class="grid-product__meta" v-bind:id="product.id">
            <span class="grid-product__title">{{ product.title }}</span>
            <span class="grid__price">
              <span class="grid__price-actual"></span>
              <strike class="grid__price-compare"></strike>
            </span>
            <span class="grid-product__sale-msg">{{ product.sale_msg }}</span>
            
          </a>
          <div class="grid-product__variants">
              <div v-for="variant in product.variants"
                  class="variant-selector"
                  :class="{ 'variant-selector--color-duplicate': isDuplicate(variant,product.id), 'size-sold-out': variant.quantityAvailable < 6 }"
                  :data-variant-id="variant.id" 
                  :data-variant-price="variant.price" 
                  :data-variant-image="resizeImage(variant.image)" 
                  :data-variant-compare-at-price="variant.compareAtPrice"
                  :data-variant-new="variant.new"
                  :data-variant-new-style="product.new_styles.indexOf(parseInt(variant.id)) > -1 ? true: false"
                  :data-variant-exclusively-men="variant.exclusively_men"
                  :data-variant-exclusively-women="variant.exclusively_women"
                  :data-variant-hover-image="hoverImage(variant)" 
                  :data-variant-color="variantColor(variant,product.id)" 
                  :data-variant-color-filter-friendly="variantFilterFriendlyColor(variant,product.id)" 
                  :data-variant-size="variantSize(variant,product.id)"
                  :data-variant-qty="variant.quantityAvailable < 6 ? 'size-sold-out' : variant.quantityAvailable"
                  >
                      <img loading="lazy" v-bind:src="swatchImgSrc(variant,product.id)" v-bind:alt="variantColor(variant,product.id)" onerror="this.onerror=null; this.src='https://cdn.shopify.com/s/files/1/2256/2959/t/202/assets/swatch-white.png'">
              </div>
              <a v-if="colors[product.id].length > 4" class='variant-selector-extra-count' :href="product.url">
               +{{colors[product.id].length - 4}}
              </a>
          </div>        
          <div class="grid-product__controls">
            <div class="grid-product__add-to-cart btn">Add To Cart</div>
            <div class="grid-product__sizes">
              <div class="grid-product-size" data-size="small">S</div>
              <div class="grid-product-size" data-size="medium">M</div>
              <div class="grid-product-size" data-size="large">L</div>
              <div class="grid-product-size" data-size="xlarge">XL</div>
            </div>
          </div>
      </div>
  </div>
  `,
  props: {
      product: Object
  },
  data: function() {
      return {
          variants: {},
          colors: {}
      }
  },
  computed: {
      hasProducts: function () {
          return this.products.length;
      },
      aLiquidAsset() {
          return window.aLiquidAsset || '';
      },
      liquidAssetPath() {
          const aLiquidAsset = this.aLiquidAsset;
          return aLiquidAsset.substr(0, aLiquidAsset.lastIndexOf("/") + 1);
      }
  },
  methods: {
      resizeImage(image) {
          if(image == null) {
              return
          }
          var imageWidth = "_389x"
          var positionOfFileExtention = image.indexOf(".jpg")
          if(positionOfFileExtention == -1) {
            positionOfFileExtention = image.indexOf(".jpeg")
          }
          if(positionOfFileExtention == -1) {
            positionOfFileExtention = image.indexOf(".png")
          }
          return [image.slice(0, positionOfFileExtention), imageWidth, image.slice(positionOfFileExtention)].join('');
      },
      checkVariant(variant, id) {
          if(!this.variants.hasOwnProperty(variant.id)) {
              this.variants[variant.id] = variant;
          }
          if(!(id in this.colors)) {
              this.colors[id] = [];
          }
      },
      isDuplicate(variant,id) {
          this.checkVariant(variant,id);
          return this.variants[variant.id].isDuplicate;
      },
      swatchImgSrc(variant,id) {
          this.checkVariant(variant,id);
          if(!this.variants[variant.id].swatchColor) {
              this.variants[variant.id].swatchColor = this.variantColor(variant,id);
          }
          let assetName = "swatch-" + this.variants[variant.id].swatchColor.replace(/\s+/g, '-').toLowerCase() + ".png";
          return this.liquidAssetPath + assetName;
      },
      variantFilterFriendlyColor(variant,id) {
          this.checkVariant(variant,id);
          let theValue
          if(variant.hasOwnProperty('parent_colors') && variant.parent_colors) {
              theValue = variant.parent_colors;
          } else {
              theValue = this.variantColor(variant,id);
          }
          return theValue;
      },
      variantColor(variant,id) {
          this.checkVariant(variant,id);
          if(!this.variants[variant.id].swatchColor) {
              for (let option of variant.options) {
                  if(option.name.toLowerCase().includes('color')) {
                      const color = option.value.toLowerCase();
                      this.variants[variant.id].swatchColor = color;
                      if(this.colors[id].indexOf(color) === -1) {
                          this.colors[id].push(color);
                      } else {
                          this.variants[variant.id].isDuplicate = true;
                      }
                      break;
                  }
              }
          }

          return this.variants[variant.id].swatchColor;
      },
      variantSize(variant,id) {
          this.checkVariant(variant,id);
          if(!this.variants[variant.id].variantSize) {
              for (let option of variant.options) {
                  if(option.name.toLowerCase().includes('size')) {
                      this.variants[variant.id].variantSize = option.value.toLowerCase();
                      break;
                  }
              }
          }

          return this.variants[variant.id].variantSize;
      },
      hoverImage(variant) {
          let hoverImg = null;
          //hover image is the 3rd variant image, as long as there are 3 images
          if(variant.images.length >= 3 ) {
              hoverImg = variant.images[2].originalSrc;
              //if there are only 2 variant image, the 2nd is the hover image
          } else if ( variant.images.length === 2 ) {
              hoverImg = variant.images[1].originalSrc;
          }
          //loop thru variant images
          variant.images.forEach((image, index) => {
              //if any of the variant images contain "hover|" in it's alt text, thats the hover image
              if( image.altText.toLowerCase().includes('hover|')  ) {
                  hoverImg = image.originalSrc;
              }
          })
          return this.resizeImage(hoverImg);
      },
      convertToArray(obj) {
          return Object.keys(obj).map((key) => obj[key]);
      }
  }
})
collectionApp.mount('#collectionApp')
