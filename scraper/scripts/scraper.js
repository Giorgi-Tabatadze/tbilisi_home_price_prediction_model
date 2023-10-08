const puppeteer = require("puppeteer");
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios'); 

const csvWriter = createCsvWriter({
  path: "../../data/housing_data.csv",
  header: [    
      {id: 'id', title: 'ID'},
      {id: 'url', title: 'URL'},
      {id: 'imageurl', title: 'IMAGEURL'},
      {id: 'header', title: 'HEADER'},
      {id: 'price', title: 'PRICE'},
      {id: 'pricesq', title: 'PRICESQ'},
      {id: 'sqmeters', title: 'SQMETERS'},
      {id: 'floor', title: 'FLOOR'},
      {id: 'rooms', title: 'ROOMS'},
      {id: 'bedrooms', title: 'BEDROOMS'},
      {id: 'address', title: 'ADDRESS'},
      // ... other headers
  ], 
  append: true
});

async function downloadImage( url, savePath) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  
  // Extract the file extension from the URL
  const fileExtension = url.split('.').pop().split('?')[0];  // This handles URLs with parameters after the file extension
  
  fs.writeFileSync(`${savePath}.${fileExtension}`, response.data);
}

async function myhomegeScraper(id, npages, url) {
  const TOTAL_PAGES = npages;

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox"],
      defaultViewport: { width: 1366, height: 768 },
    });
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForTimeout(5000);

    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const scrapeddata = await page.evaluate((id) => {
        const list = document.querySelector("#main_block > div.d-flex.justify-content-between.p-relative.search-content.has-map > div.search-wrap > div.search-contents.ml-0 > div");
        const apartments = [];
        const arrayOfApartments = Array.from(list.children);
        arrayOfApartments.forEach((apartmentdiv) => {
          cardbodyDriled = apartmentdiv?.children[0]?.children[1]?.children[0]
          cardtext = apartmentdiv?.children[0]?.children[1]?.children[0]?.children[1]
  
          const aparmentid = id
          ++id
          const urlElement = apartmentdiv?.children?.[0];
          const url = urlElement?.href || null;
          const imageurl = apartmentdiv?.getAttribute('data-thumb');
          const header = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[0]?.innerText;
          const price = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[0].children?.[1]?.innerText;
          const pricesq = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[2]?.children?.[2]?.innerText;
          const sqmeters = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[3]?.innerText;
          const floor = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[1]?.children?.[0]?.children?.[1]?.innerText;
          const rooms = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[1]?.children?.[1]?.children?.[1]?.innerText;
          const bedrooms = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[1]?.children?.[2]?.children?.[1]?.innerText;
          const address = apartmentdiv?.children?.[0]?.children?.[1]?.children?.[0]?.children?.[1]?.children?.[2]?.innerText;
          
          
          const apartment = {
            url,
            id:aparmentid,
            imageurl,
            header,
            price,
            pricesq,
            sqmeters,
            floor,
            rooms,
            bedrooms,
            address
          };
          apartments.push(apartment);
        });
        return {apartments, id};
      }, id);
      id = scrapeddata.id
      for (const apartment of scrapeddata.apartments) {
        if (apartment.imageurl) {
          const imageName = apartment.id;
          try {
            await downloadImage(apartment.imageurl, `../../data/images/${imageName}`);
          } catch (error) {
            if (error.response && error.response.status === 404) {
              console.warn(`Image not found at URL: ${apartment.imageurl}`);
            } else {
              console.error(`Error downloading image from URL: ${apartment.imageurl}`, error);
            }
          }        
        }
      }
      
  
      csvWriter.writeRecords(scrapeddata.apartments).then(() => {
        console.log(`Data written successfully! for id: ${id}`);
      });
      await page.waitForTimeout(3000);

      
      await page.click(
        "#main_block > div.d-flex.justify-content-between.p-relative.search-content.has-map > div.search-wrap > nav > ul > li.page-item.step-forward-item > a",
      );

      // Wait for 5-10 seconds before loading the next page
      await page.waitForNavigation();
    }

    await browser.close();

  } catch (error) {
    console.log(error)
  }

}

myhomegeScraper(45602, 1000, "https://www.myhome.ge/ka/s/iyideba-bina-Tbilisi?Keyword=თბილისი&AdTypeID=1&PrTypeID=1&Page=2080&mapC=41.73188365%2C44.8368762993663&cities=1996871&GID=1996871&FCurrencyID=1&FPriceFrom=10000&WithPhoto=1")