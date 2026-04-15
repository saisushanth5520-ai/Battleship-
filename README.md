# AI6001_Battleship

Project Group Members:

* Group Member Name 1 (Sai Sushanth Chandrasekaran , sschandrasek@mun.ca)
* Group Member Name 2 (Rizwan Ahmed Javed, rizwanaj@mun.ca)

Project URL
https://groupJ.stu.researchatmun.ca

Project Videos:

* Project Presentation: https://youtu.be/98BkrUoFeEE

Project Setup / Installation:

## Project Setup / Installation

### Prerequisites
Make sure you have the following installed on your machine before running 
the project:
- Docker Desktop which includes both Docker and Docker Compose
  Download from: https://www.docker.com/products/docker-desktop
- Git for cloning the repository
  Download from: https://git-scm.com

### Steps to Run Locally

**Step 1 — Clone the repository**

git clone https://github.com/saisushanth5520-ai/Battleship-.git
cd Battleship-

**Step 2 — Copy the Docker files to the root folder**

The Dockerfile and docker-compose.yml are inside the docker folder and 
need to be moved to the root before running:

cp docker/docker-compose.yml .
cp docker/Dockerfile .

**Step 3 — Create your environment file**

Create a new file called .env in the root folder and paste the following 
inside it. These variables configure the database connection, the JWT 
secret for authentication, and the port the server runs on:

MONGODB_URI=mongodb://mongo:27017/battleship
JWT_SECRET=battlesecret123
PORT=3000

**Step 4 — Build and start the application**

Run the following command from the root folder. This will build the 
Node.js server container and automatically pull the MongoDB image. 
The first build may take a few minutes depending on your internet speed:

docker compose up --build

**Step 5 — Open the app in your browser**

Once the build is complete and you see "Server running on port 3000" 
and "MongoDB connected" in the terminal, open your browser and go to:

http://localhost:3000

**Step 6 — To stop the application**

When you are done, press Ctrl C in the terminal or run:

docker compose down

This stops and removes the containers while keeping your database data intact.

### Live Hosted Version
The application is also deployed and accessible online at:
https://groupJ.stu.researchatmun.ca
