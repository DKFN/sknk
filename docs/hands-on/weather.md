# Your first SKNK app

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
mkdir superweather && cd superweather && cd motherapp && npm init
```

As this will be our mother app lets install the server library
```console
npm install --save sknk
```

Nice let's get into a bit of coding, first the html:

`superweather/motherapp/src/index.html`
```html
<html>
    <head>
        <title>Super Weather !</title>
        <!-- A bit of style !-->
        <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.0/build/pure-min.css" integrity="sha384-nn4HPE8lTHyVtfCBi5yW9d20FjT8BJwUXyWZT9InLYax14RDjBj46LmSztkmNP9w" crossorigin="anonymous">
    </head>
    <body>
        <h1>Super Weather</h1>
        <hr />
        Type the city you wish to get the weather from then click on Submit<br />
        <form class="pure-form">
            <input type="text" id="city" placeholder="paris"/>
            <button id="submit">Submit</button>
        </form>>
    </body>
</html>
```

[Result screen shot]

Now lets use our packager to build the app:

```superweather/motherapp/src/package.json```
```json
HERE PACKAGE JSON
```

We want to wire a bit of logic, each time the user is clicking Submit we want to run the detail app, of course
it does not exist yet ! So for now we will just display the value on the console

```superweather/motherapp/src/index.js```
```js
let input = document.getElementById("city");
let button = document.getElementById("submit");
const handleClickSubmit = (event) => {
    const cityValue = input.value;
    console.log(cityValue); // Instead of the console.log there will be the run app call
};

button.onclick = handleClickSubmit;
```

[Result screen shot with console]

## Step2: Create the children app

This one will be a bit more complex because it takes the city name in parameter thens call
www.prevision-meteo.ch free meteo API to get current weather

Go back to your route fol

[Implement child app indexjs]

Now that our app is working independently, lets use the client

First import the client
```js
var sknk = require("sknk-client");

```

NOTE : You will notice that the app will not render itself anymore, this is because your app now needs a sknk
server to run, here is [How to setup a sknk developement server]