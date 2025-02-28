addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

function getId(data) {
  var returnData = atob(data).split('/');
  return returnData[4];
}

async function getData(params) {
  console.log(params.collection);
  var responseData;
    await fetch('https://feetures-online.myshopify.com/api/2021-04/graphql', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type' : 'application/graphql',
    'X-Shopify-Storefront-Access-Token' : 'd90ee2aab7cb952806ef74c4f63bc2e2'
  },
  body: `query {
  collectionByHandle(handle: "`+ params.collection + `") {
    products(first: 100) {
      edges {
        node {
          id
          handle
          tags
          mens_default_color: metafield(
                    namespace: "accentuate"
                    key: "mens_default_color"
                ) {
                    value
                }
                womens_default_color: metafield(
                    namespace: "accentuate"
                    key: "womens_default_color"
                ) {
                    value
                }
          images(first: 30) {
          edges {
            node {
              originalSrc
              altText
            }
          }
        }
          variants(first:100) {
            edges {
              node {
                new: metafield(
                    namespace: "accentuate"
                    key: "new"
                ) {
                    value
                }
                exclusively_women: metafield(
                    namespace: "accentuate"
                    key: "exclusively_women"
                ) {
                    value
                }
                exclusively_men: metafield(
                    namespace: "accentuate"
                    key: "exclusively_men"
                ) {
                    value
                }
                parent_colors: metafield(
                    namespace: "accentuate"
                    key: "parent_colors"
                ) {
                    value
                }

                presentmentPrices(first:100){
                  edges {
                    node {
                      price {
                        amount
                      }
                      compareAtPrice {
                        amount
                      }
                    }
                  }
                }
                id
                quantityAvailable
                selectedOptions{
                  name
                  value
                }
                image {
                  originalSrc
                }
              }
            }
          }
          options {
            name
            values
          }

        }
      }
    }
  }
}`
})
  .then(r => r.json())
  .then(data => {
      // console.log(data)
      // console.log(data.errors)
      // console.log(JSON.stringify(data));
      if (typeof data.data === "undefined") {
        console.log('shopify didnt respond. trying again')
        responseData = getData(params);
        // if (data.errors[0].message == 'Timeout') {
        //   console.log('moo');

        // }
      } else {
        responseData = data.data.collectionByHandle.products.edges;
      }



  });
  return responseData;
}

/**
 * Respond to the request
 * @param {Request} request
 */
 async function handleRequest(event) {
   var request = event.request;
   var prettyData = [];
  const cacheUrl = new URL(request.url)


  // const cacheKey = new Request(cacheUrl.toString(), request)
  // const cacheKey = cacheUrl.toString();
  // const cache = caches.default
  // console.log(cacheKey);

  // let response = await cache.match(cacheKey);




  // if (response) {
  //     console.log('cached')
  //   return response;
  // }

   const params = {}
    const url = new URL(request.url)
    const queryString = url.search.slice(1).split('&')

    queryString.forEach(item => {
      const kv = item.split('=')
      if (kv[0]) params[kv[0]] = kv[1] || true
    })

// console.log(params.cachewarmer);
    const cacheData = await FIRST_KV_NAMESPACE.getWithMetadata(params.collection);
     const value = cacheData.value;
     const metadata = cacheData.metadata;
     console.log(metadata);
    // console.log(value);
  if ((value === null) || (params.cachewarmer == 'true')) {
    console.log('not in cache');
  } else {
      console.log('already in cache');
      response = new Response(value, {status: 200})
    response.headers.set('Access-Control-Allow-Method', '*')
    response.headers.set('Netalico-Cache', 'hit')

    if (metadata) {
      response.headers.set('Netalico-Cache-Time', metadata.cachetime)
      response.headers.set('Netalico-CacheWarmer', metadata.cachewarmer)
    }

    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Headers', '*')
    response.headers.append("Cache-Control", "max-age=300")
    return response;
  }


   var responseData = await getData(params);

  for (var p in responseData) {

    prettyData[p] = responseData[p].node;

    prettyData[p].id = getId(prettyData[p].id);
    if (prettyData[p].mens_default_color) {
      prettyData[p].mens_default_color = prettyData[p].mens_default_color.value;
    }

    if (prettyData[p].womens_default_color) {
      prettyData[p].womens_default_color = prettyData[p].womens_default_color.value;
    }

    for (var z in prettyData[p].variants.edges ) {
         prettyData[p].variants[z] = prettyData[p].variants.edges[z].node;
         prettyData[p].variants[z].id = getId(prettyData[p].variants[z].id);
         prettyData[p].variants[z].price = prettyData[p].variants[z].presentmentPrices.edges[0].node.price.amount;

        // console.log(prettyData[p].variants[z].presentmentPrices);
        if (prettyData[p].variants[z].presentmentPrices.edges[0].node.compareAtPrice) {
          prettyData[p].variants[z].compareAtPrice = prettyData[p].variants[z].presentmentPrices.edges[0].node.compareAtPrice.amount;
        } else {
          prettyData[p].variants[z].compareAtPrice = null;
        }

         prettyData[p].variants[z].options = prettyData[p].variants[z].selectedOptions;
         prettyData[p].variants[z].image = prettyData[p].variants[z].image.originalSrc;

        if (prettyData[p].variants[z].new) {
          prettyData[p].variants[z].new = prettyData[p].variants[z].new.value;
        }

         if ( prettyData[p].variants[z].exclusively_men) {
           prettyData[p].variants[z].exclusively_men = prettyData[p].variants[z].exclusively_men.value;
         }

         if (prettyData[p].variants[z].exclusively_women) {
           prettyData[p].variants[z].exclusively_women = prettyData[p].variants[z].exclusively_women.value;
         }

         if (prettyData[p].variants[z].parent_colors) {
           prettyData[p].variants[z].parent_colors = prettyData[p].variants[z].parent_colors.value.split('|')
         }



        prettyData[p].variants[z].images = [];
         if (prettyData[p].images) {
             for (image in prettyData[p].images.edges) {
                 image = prettyData[p].images.edges[image].node;
                 if (image.altText) {
                    if (image.altText.includes(prettyData[p].variants[z].options[0].value)) {
                        prettyData[p].variants[z].images.push(image);
                    }

                    if (image.altText.includes(prettyData[p].variants[z].options[1])) {
                        if (image.altText.includes(prettyData[p].variants[z].options[1].value)) {
                            prettyData[p].variants[z].images.push(image);
                        }
                    }
                 }
             }
         }


         delete prettyData[p].variants[z].selectedOptions;
         delete prettyData[p].variants[z].presentmentPrices
      }
       delete prettyData[p].images;
      delete prettyData[p].variants.edges;

    }

  console.log(prettyData);

  // await FIRST_KV_NAMESPACE.delete(params.collection);
  console.log(params.collection);
  if (params.cachewarmer == 'true') {
      console.log('about to put it in cache')
      await FIRST_KV_NAMESPACE.put(params.collection, JSON.stringify(prettyData), {expirationTtl: 1200, metadata: {cachetime: Date.now(), cachewarmer: true }})
      console.log('We put it in cache')
  } else {
    await FIRST_KV_NAMESPACE.put(params.collection, JSON.stringify(prettyData), {expirationTtl: 1200, metadata: {cachetime: Date.now(), cachewarmer: false }})
  }

  response = new Response(JSON.stringify(prettyData), {status: 200})
  response.headers.set('Netalico-Cache', 'miss')
  response.headers.set('Access-Control-Allow-Method', '*')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Headers', '*')
  response.headers.append("Cache-Control", "max-age=300")

  // event.waitUntil(cache.put(cacheKey, response.clone()))
  return response;


}
