<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
<!-- [![CC BY-NC-SA 4.0 License][license-shield]][license-url] -->

</div>



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/bwei2121/Tennis-Bracketology">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Tennis-Bracketology</h3>

  <p align="center">
    View from a variety of tennis tournaments since 2023, predict a tournament bracket, and gain insights for your match predictions.
    <br />
    <!-- <a href="https://github.com/bwei2121/Tennis-Bracketology"><strong>Explore the docs »</strong></a> -->
    <!-- <br />
    <br /> -->
    <!-- <a href="https://github.com/bwei2121/Tennis-Bracketology">View Demo</a>
    · -->
    <a href="https://github.com/bwei2121/Tennis-Bracketology/issues">Report Bug</a>
    ·
    <a href="https://github.com/bwei2121/Tennis-Bracketology/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#latest-updates">Latest Updates</a>
    </li>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#choose-tournament">Choose Tournament</a></li>
        <li><a href="#view-bracket">View Bracket</a></li>
        <li><a href="#predict-bracket">Predict Bracket</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- LATEST UPDATES -->
## Latest Updates
* View tournament bracket from any seeded player's perspective
* View tournament bracket from the Quarterfinals and Onwards
* Gives feedback on correctly and incorrectly predicted matches
* Shows overall prediction rate for the tournament bracket

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ABOUT THE PROJECT -->
## About The Project

View from a variety of tennis tournaments since 2023, predict a tournament bracket, and gain insights on your match predictions. I created this application to create a visual display for the tournaments being tracked on [Tennis Abstract](https://www.tennisabstract.com/). As well, I wanted to challenge myself in learning the skills needed on how to create a full-stack application and what to do before making an application public. See <a href="#usage">Usage</a> to understand how to use the application. I hope this application is helpful to you!


### Built With

* [![Angular][Angular.io]][Angular-url]
* [![Django][Djangoproject.com]][Django-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local application running, follow these installation steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* <a href=https://docs.npmjs.com/downloading-and-installing-node-js-and-npm>npm</a>
* <a href="https://www.typescriptlang.org/download">Typescript</a>
* <a href="https://www.python.org/downloads/">Python</a>
* <a href="https://pip.pypa.io/en/stable/installation/">pip</a>


### Installation

1. Clone the repo
   ```sh
   ex. git clone https://github.com/bwei2121/Tennis-Bracketology.git
   ```
2. Install npm requirements from tennis_frontend folder
   ```sh
   ex. cd Tennis-Bracketology/tennis_frontend && npm install (Linux)
   ```
3. Install Python requirements from tennis_backend folder
   ```sh
   ex. python3 -m pip install -r .\Tennis-Bracketology\tennis_backend\requirements.txt (Windows)
   ```
4. Generate Django secret key for Tennis-Bracketology/tennis_backend/settings.py file. <br> Run Tennis-Bracketology/tennis_backend/secret_key.py for Django secret key. <br> Create a config.ini file with Django secret key. <br> View config.ini.example file for help.
   ```sh
   ex. python3 .\secret_key.py (Windows)
   ```
5. Apply Django database migrations using Tennis-Bracketology/tennis_backend/manage.py file
   ```sh
   ex. python3 .\Tennis-Bracketology\tennis_backend\manage.py makemigrations tennis_bracket (Windows)
       python3 .\Tennis-Bracketology\tennis_backend\manage.py migrate (Windows)
   ```
6. Run backend server (http://localhost:8000/)
   ```sh
   ex. python3 .\Tennis-Bracketology\tennis_backend\manage.py runserver (Windows)
   ```
7. Run frontend server (http://localhost:4200/)
   ```sh
   ex. cd Tennis-Bracketology/tennis_frontend && ng serve (Linux)
   ```
8. You are now able to run the application!

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

### Choose Tournament
<!-- <h3><b>Choose Tournament</b></h3> -->

![Choose Tournament Screenshot][choose-tournament-screenshot]
* Choose from one of the many tournaments displayed. Recent tournaments are bolded for your convenience. Choose to view/predict a tournament bracket using the buttons in the top right of the page before clicking on a tournament. You may also search for a tournament using the search bar at the top of the page.

### View Bracket
<!-- <h3><b>View Bracket</b></h3> -->

![View Bracket Screenshot][view-bracket-screenshot]
*View Full Tournament Bracket*

![View Bracket QF Screenshot][view-bracket-qf-screenshot]
*View QF and Onwards Tournament Bracket*

* View a tournament bracket. Depending on the status of the tournament, the bracket may only be showing first round matches, be partially filled, or be fully completed. On the tournament bracket, you can view the winner and score of each match that is completed. To view the bracket from the Quarterfinals and onwards, click the "Switch to QF+ View" button. Use the dropdown on the right side of the page to view the bracket from a seeded player's perspective.

### Predict Bracket
<!-- <h3><b>Predict Bracket</b></h3> -->

![Predict Bracket Screenshot][predict-bracket-screenshot]
*Predict Tournament Bracket*

![Predict Match Screenshot][predict-match-screenshot]<br>*Predict Tournament Match*</br>

* Predict a tournament bracket. The bracket will only show first round matches so you can predict the rest of the bracket. To predict a match, click the container of the match in interest. A match predictor popup will show up, and you will be able to enter scores in the match prediction section. Reference the match information section if you need to be familiarized with the two tennis players. Then, click the button at the bottom with the player that you believe will win the match, and click submit. To save your bracket, click the "Save Bracket" button on the right side of the page. Once changes are saved, you may come back to this bracket at any time, and the bracket will be filled up to the point of the last save. Refresh the page or come back when the tennis matches have finished to view if you correctly predicted the bracket. Predicted winners highlighted green are matches predicted correctly while predicted winners highlighted red and struck through are matches predicted incorrectly. The overall prediction rate for the bracket is displayed on the right hand side of the page. 

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Future improvements

- [ ] More interactive brackets
  - [x] View bracket by round or seeded player's point of view
  - [ ] Allow users to undo match predictions in brackets
- [ ] Statistics on user predictions
  - [x] Bracket prediction rate
  - [ ] Overall prediction rate over many tournaments
  - [ ] Prediction rate of seeded players
- [ ] Incorporate dashboard into application


<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Tennis Bracketology © 2024 by Brandon Wei is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en). See [`LICENSE.txt`][license-url] for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Brandon Wei 

Email: brandon.wei1221@gmail.com 

LinkedIn: https://www.linkedin.com/in/brandon-wei21/

Project Link: [https://github.com/bwei2121/Tennis-Bracketology](https://github.com/bwei2121/Tennis-Bracketology)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments
Big thanks to everything listed below!!!

* [Angular Material](https://material.angular.io/)
* [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [brackets-manager](https://github.com/Drarig29/brackets-manager.js)
* [brackets-viewer](https://github.com/Drarig29/brackets-viewer.js)
* [Tennis Abstract](https://www.tennisabstract.com/)
* View all acknowledgements by clicking the "Acknowledgements" button on the "Choose Tournament" page

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/bwei2121/Tennis-Bracketology.svg?style=for-the-badge
[contributors-url]: https://github.com/bwei2121/Tennis-Bracketology/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/bwei2121/Tennis-Bracketology.svg?style=for-the-badge
[forks-url]: https://github.com/bwei2121/Tennis-Bracketology/network/members
[stars-shield]: https://img.shields.io/github/stars/bwei2121/Tennis-Bracketology.svg?style=for-the-badge
[stars-url]: https://github.com/bwei2121/Tennis-Bracketology/stargazers
[issues-shield]: https://img.shields.io/github/issues/bwei2121/Tennis-Bracketology.svg?style=for-the-badge
[issues-url]: https://github.com/bwei2121/Tennis-Bracketology/issues
[license-shield]: https://img.shields.io/github/license/bwei2121/Tennis-Bracketology.svg?style=for-the-badge
[license-url]: https://github.com/bwei2121/Tennis-Bracketology/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/brandon-wei21/
[product-screenshot]: images/screenshot.png
[choose-tournament-screenshot]: images/choose_tournament.png
[view-bracket-screenshot]: images/view_bracket.png
[view-bracket-qf-screenshot]: images/view_bracket_qf.png
[predict-bracket-screenshot]: images/predict_bracket.png
[predict-match-screenshot]: images/predict_match.png
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Djangoproject.com]: https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green
[Django-url]: https://www.djangoproject.com/
