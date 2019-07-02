# Your first SKNK app (In progress)

## Introduction
The goal is to build two very simple Javascript applications that will interact with eachorther 
to display the weather of a City.

We will spend minimal time focusing into the actual applications implementation and make a simple vanillajs focus on the
important SKNK concepts along the way.

Of course, it is over engineered for as simple needs.

## Prerequisites
For simplicity in this example I use the parcel bundler and serve server, if you don't have them, run:

`npm install -g serve parcel`

If you don't want to use them, you can use your own tools !

## Step1: Setup the mother App

Lets build a very minimal javascript app

```console
mkdir superweather && cd superweather && mkdir motherapp && cd motherapp && npm init -y
```

As this will be our mother app lets install the server library
```console
npm install --save sknk
```

Nice let's get into a bit of coding, first the html:

`mkdir src && touch src/index.html`

`superweather/motherapp/src/index.html`
```html
<html>
    <head>
        <title>Super Weather !</title>
        <!-- A bit of style !-->
    </head>
    <body>
        <h1>Super Weather</h1>
        <hr />
        Type the city you wish to get the weather from then click on Submit<br />
        <input type="text" id="city" value="paris"/>
        <button id="submit">Submit</button>
    </body>
</html>
```

Now lets use our packager to build the app, your package.json (here parcel) should look like this

`superweather/motherapp/src/package.json`
```json
{
  "name": "motherapp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "parcel dev ./src/index.html",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "sknk": "0.0.25"
  }
}

```

Nice, so if you run `npm run dev` and go to `http://localhost:1234/` you should see this amazing UI:
![](https://tetelincdn.b-cdn.net/sknk/images/weather-htmlmain.png)

We want to wire a bit of logic, each time the user is clicking Submit we want to run the detail app, of course
it does not exist yet ! So for now we will just display the value on the console

`touch src/index.js`

`superweather/motherapp/src/index.js`
```js
let input = document.getElementById("city");
let button = document.getElementById("submit");
const handleClickSubmit = () => {
    const cityValue = input.value;
    console.log(cityValue); // Instead of the console.log there will be the run app call
};

button.onclick = handleClickSubmit;
```

Don't forget to add the script to the index.html:
```htnl
    <body>
        [...]
        <script type="text/javascript" src="./index.js"></script>
    </body>
```

![](https://tetelincdn.b-cdn.net/sknk/images/weather-momappfirst.png)

## Step2: Create the children app

This one will be a bit more complex because it takes the city name in parameter thens call
www.prevision-meteo.ch free meteo API to get current weather (It can be slow sometimes)

Go back to your root folder (`superweather`) and create the base for the child app and run the following

`mkdir childapp && cd childapp && npm init -y`

As this is the children application you need to install the client
`npm install --save sknk-client`

This time, lets start by creating the index.js

`mkdir src && touch src/index.js`

`superweather/childapp/src/index.js`
```js
const weatherTemplate = (weatherResult) => `
    <div class="weather-result">
        <h1>
            ${weatherResult.city_info.name} - (${weatherResult.city_info.country})
            <img src="${weatherResult.current_condition.icon}" />
         </h1>
        <h3>Condition: ${weatherResult.current_condition.condition} - ${weatherResult.current_condition.tmp}C</h3>
        <h4>${weatherResult.current_condition.date}</h4> 
    </div>
`;

const renderWeather = () => {
    const root = document.getElementById("root");
    const fetchWeather = (cityName) => {
        fetch("https://www.prevision-meteo.ch/services/json/" + cityName)
            .then((res) => {
                res.json().then((data) => {
                    root.innerHTML = weatherTemplate(data)
                })
            .catch(() => {
                root.innerText = "Fetch error";
            });
        });
    };
    fetchWeather("paris");
    
};

renderWeather();
```

Now lets create a simple index.html to try our application standalone
```superweather/childapp/src/index.html```
```html
<html>
    <body>
        <div id="root">
        
        </div>
        <script type="text/javascript" src="./index.js"></script>
    </body>
</html>
```

And as before, we will add a dev script to try our application

```json
{
  "name": "childapp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "parcel dev src/index.html",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "sknk-client": "0.0.25"
  }
}
```

and run `npm run dev`

![](https://tetelincdn.b-cdn.net/sknk/images/weather-childapp-render.png)

# Step 3: Linking applications

Now that our child and mother app is working independently, lets wire our small applications together.

Lets start by adding a buildAndServe command to the package.json of the child app, that will package our main app js and lanch
a static serve to expose the bundled js locally

`superweather/childapp/package.json`
```json
{
  "name": "childapp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "parcel dev src/index.html",
    "buildAndServe": "parcel build src/index.js && serve -p 3001 -s dist/",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "sknk-client": "0.0.25"
  }
}

```

If you run `npm run buildAndServe` and go to `http://localhost:3001/index.js` you should see the packaged result of our childrenapp.

Now we need to register our app to a potential SKNK server in orther to render in our motherapp, so let's edit `superweather/childapp/src/index.js`


First import the client at the top of the file
```js
var sknk = require("sknk-client");
```

Then we need to declare what is our app, its requirements and the render function
```js
sknk.register({
    name: "weatherApp",
    layoutOptions: {
        id: "childapps-container" // This is the name we will chose for the "space" in the mother app
    },
    render: renderWeather
});
```

Of course we need to do a tiny bit of changes to our code:
- We need to take the city name as a parameter from the mother app
- We won't call `renderWeather` in the childapp on start, it is the mother app that will decide when we render
- The id of the div we will render is not the child app decision anymore, it is passed as parameter to the render function


The final code of the childApp looks like this:

`superweather/childapp/src/index.js`
```js
const sknk = require("sknk-client");

const weatherTemplate = (weatherResult) => `
    <div class="weather-result">
        <h1>
            ${weatherResult.city_info.name} - (${weatherResult.city_info.country})
            <img src="${weatherResult.current_condition.icon}" />
         </h1>
        <h3>Condition: ${weatherResult.current_condition.condition} - ${weatherResult.current_condition.tmp}C</h3>
        <h4>${weatherResult.current_condition.date}</h4> 
    </div>
`;

const renderWeather = (domId, baseData) => { // Two new parameters
    const root = document.getElementById(domId); // We change the dom id
    const fetchWeather = (cityName) => {
        fetch("https://www.prevision-meteo.ch/services/json/" + cityName)
            .then((res) => {
                res.json().then((data) => {
                    root.innerHTML = weatherTemplate(data)
                })
            .catch(() => {
                root.innerText = "Fetch error";
            });
        });
    };
    fetchWeather(baseData.city); // And where we get the city
    
};

// App registration
sknk.register({
    name: "weatherApp",
    layoutOptions: {
        id: "childapps-container"
    },
    render: renderWeather
});
```

---
**NOTE**

 You will notice that the app will not render itself anymore if you run `npm run dev`, this is because your app now needs a sknk
server to run, here is [How to setup a sknk developement server]
---

Now that our child app is fully bundled lets run it from our mother app !

Run `npm run buildAndServe` in the background and

Back to `superweather/motherapp/src/index.js` 
```js
let input = document.getElementById("city");
let button = document.getElementById("submit");
const handleClickSubmit = () => {
    const cityValue = input.value;
    console.log(cityValue); // Instead of the console.log there will be the run app call
};

button.onclick = handleClickSubmit;
```
We need to import the server first
```js
var sknk = require("sknk");
```

And we need to allow our script to be included
```js
sknk.server.allowScript({
    name: "weatherApp", // The name we chose
    src: "http://localhost:3001/index.js", // The source of our script, here local
    instances: 0 // Well... it will be removed
});
```

Now, what we want is to run the app when the user clicks submit passing the value of the input in the childapp
```js
const handleClickSubmit = () => {
    const cityValue = input.value;
    sknk.server.stopApp("weatherApp"); // We stop any previous instance if any
    sknk.server.runApp("weatherApp", { city: cityValue });
};
```

Your final file should look like this : 
Back to `superweather/motherapp/src/index.js` 
```js
var sknk = require("sknk");

sknk.server.allowScript({
    name: "weatherApp", // The name we chose
    src: "http://localhost:3001/index.js", // The source of our script, here local
    instances: 0 // Well... it will be removed
});

let input = document.getElementById("city");
let button = document.getElementById("submit");
const handleClickSubmit = () => {
    const cityValue = input.value;
    sknk.server.stopApp("weatherApp"); // We stop any previous instance if any
    sknk.server.runApp("weatherApp", { city: cityValue });
};

button.onclick = handleClickSubmit;
```

Finally, the last step is to tell where the app(s) can render, this is done by placing a new div.

If we edit our index.html from our mother app and add
```html
<div class="skunk-space" skunk-id="strates"></div>
```

Giving:

`superweather/motherapp/src/index.html`
```html
<html>
    <head>
        <title>Super Weather !</title>
        <!-- A bit of style !-->
    </head>
    <body>
        <h1>Super Weather</h1>
        <hr />
        Type the city you wish to get the weather from then click on Submit<br />
        <input type="text" id="city" value="paris"/>
	<button id="submit">Submit</button><br />
	<div class="skunk-space" skunk-id="childapps-container"></div>
	<script type="text/javascript" src="./index.js"></script>
    </body>
</html>

```

And Thats it :)

If you run the motherapp with `npm run dev` you will have the second app running when you click submit

![](https://tetelincdn.b-cdn.net/sknk/images/weather-result.png)
