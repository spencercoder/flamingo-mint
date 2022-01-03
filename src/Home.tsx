import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from 'react-router-dom';
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import Main from './pages/Main';

import backgroundImg from '../public/images/background.jpg';
import flamingoLeftImg from '../public/images/1per.png';
import flamingoRightImg from '../public/images/2.png';
import palmImg from '../public/images/palm.png';
import sandImg from '../public/images/sand.png';
import meImg from '../public/images/me.jpeg';

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)``; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsAvailable,
        itemsRemaining,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    props.connection,
  ]);

  const modalRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<Boolean>(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <main>
      <div className="grid grid-cols-5 bg-white h-15 z-10">
        {/* Socials */}
        <div className="z-10 items-center col-span-1 ml-5 h-full md:flex">
          <a
            href="https://twitter.com/flamingomafiaa"
            className="text-black hover:text-red-400"
          >
            <svg role="img" viewBox="0 0 24 24" className="mr-4 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>Twitter</title><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
          <a
            href="https://discord.io/FlamingoMafia"
            className="text-black hover:text-red-400"
          >
            <svg role="img" viewBox="0 0 24 24" className="mr-1 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/flamingomafianft/"
            className="text-black hover:text-red-400"
          >
            <svg role="img" viewBox="0 0 46 46" className="w-12 h-12 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>Instagram</title><path d="M29.76 29.03v-7.373h-1.537c.152.48.23.975.23 1.49 0 .958-.243 1.838-.73 2.647-.485.807-1.146 1.447-1.98 1.918-.834.47-1.744.705-2.73.705-1.495 0-2.773-.514-3.835-1.543-1.062-1.027-1.593-2.27-1.593-3.726 0-.517.076-1.013.228-1.49H16.21v7.373c0 .2.065.37.2.5.13.14.296.2.494.2H29.07c.188 0 .352-.06.488-.2s.202-.3.202-.49zm-3.233-6.064c0-.94-.343-1.743-1.03-2.406-.686-.664-1.515-.996-2.486-.996-.96 0-1.78.332-2.47.996-.68.663-1.03 1.466-1.03 2.406 0 .942.35 1.743 1.03 2.407s1.51.996 2.48.996c.975 0 1.8-.34 2.49-1s1.03-1.47 1.03-2.41zm3.233-4.097v-1.88c0-.22-.076-.4-.23-.56-.15-.158-.336-.235-.556-.235h-1.98c-.22 0-.406.08-.558.233-.15.155-.228.34-.228.552v1.876c0 .22.076.404.228.556s.337.23.558.23h1.98c.22 0 .406-.078.557-.23.16-.15.23-.338.23-.558zm1.98-2.37v12.99c0 .61-.22 1.14-.66 1.58-.44.44-.967.66-1.582.66H16.502c-.614 0-1.142-.22-1.582-.66-.44-.44-.66-.97-.66-1.586V16.5c0-.614.22-1.142.66-1.582.44-.44.967-.66 1.582-.66h12.996c.615 0 1.14.22 1.582.66.44.44.66.967.66 1.58z"/>
            </svg>
          </a>
        </div>

        <div className="col-span-1 md:hidden" />

        {/* Nav */}
        <div
          className="flex col-span-3 gap-5 justify-center items-center h-full"
          style={{
            fontFamily: 'Kollektif'
          }}
        >
          <a
            href="#about"
            className="z-10 font-bold text-black text-md hover:text-red-400 md:block"
          >
            About
          </a>
          <a
            href="#home"
            className="z-10 font-bold text-black text-md hover:text-red-400 md:block"
          >
            Home
          </a>
          <span
            className="mx-4 text-3xl text-black select-none"
            style={{
              fontFamily: 'Kollektif Bold',
              fontWeight: 900
            }}
          >
            Flamingo Mafia
          </span>
          <a
            href="#faq"
            className="z-10 font-bold text-black text-md hover:text-red-400 md:block"
          >
            FAQ
          </a>
          <a
            href="#roadmap"
            className="z-10 font-bold text-black text-md hover:text-red-400 md:block"
          >
            Roadmap
          </a>
        </div>

        {/* Right Padding */}
        <div className="hidden items-center mr-5 ml-auto h-full md:flex">
          {wallet ? (
            <div
              className="px-4 py-2 bg-black rounded-md shadow-sm select-none"
            >
              Connected
            </div>
          ) : (
            <ConnectButton
              style={{
                background: 'black'
              }}
            >
              Connect Wallet
            </ConnectButton>
          )}
        </div>

        <div className="flex items-center ml-auto mr-2 col-span-1 h-full md:hidden">
          <button
            className="flex items-center justify-center w-12 h-12 text-black"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`${isMobileMenuOpen ? 'flex' : 'hidden'} z-50 fixed top-0 left-0 w-screen h-screen text-black text-3xl bg-white p-6 flex-col items-center gap-4`}
      >
        <button
          className="absolute top-3 right-3 flex items-center justify-center w-12 h-12 text-black"
          onClick={toggleMobileMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <a href="#">Twitter</a>
        <a href="#">Discord</a>
        <div className="w-full h-1 bg-black" />
        <a href="#/home">Home</a>
        <a href="#/about">About</a>
        <a href="#/faq">FAQ</a>
        <a href="#/roadmap">Roadmap</a>
      </div>

      <div
        id="home"
        className="z-0 relative w-full h-screen bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImg})`
        }}
      >
        {/* Left Palm Tree */}
        <div
          className="absolute left-0 top-0 h-3/4 w-1/4 bg-cover"
          style={{
            backgroundImage: `url(${palmImg})`,
            backgroundPosition: '0 50%;',
            transform: 'scaleX(-1)'
          }}
        />

        {/* Right Palm Tree */}
        <div
          className="absolute right-0 top-0 h-3/4 w-2/5 bg-cover"
          style={{
            backgroundImage: `url(${palmImg})`,
            backgroundPosition: '0 50%;'
          }}
        />
        
        {/* Left Flamingo */}
        <div
          className="absolute bottom-40 h-5/6 w-2/5 bg-cover"
          style={{
            left: '-4%',
            backgroundImage: `url(${flamingoLeftImg})`,
            backgroundPosition: '0 50%;'
          }}
        />

        {/* Right Flamingo */}
        <div
          className="absolute bottom-40 h-5/6 w-2/5 bg-cover"
          style={{
            right: '12%',
            backgroundImage: `url(${flamingoRightImg})`,
            backgroundPosition: '0 50%;'
          }}
        />

        {/* Sand */}
        <div
          className="absolute left-0 bottom-0 h-3/6 w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${sandImg})`
          }}
        />

      
        {wallet ? <button
          className="absolute w-30 h-12 font-bold rounded-lg flex justify-center items-center transition-all duration-100 hover:(shadow-md)"
          style={{
            top: 'calc(50% - calc(3rem / 2) - 3.75rem)',
            left: 'calc(50% - calc(7.5rem / 2))',
            backgroundColor: '#B84570'
          }}
          disabled={isSoldOut || isMinting || !isActive}
          onClick={onMint}
        >
          {isSoldOut ? (
            <span className="text-xl">SOLD OUT</span>
          ) : isActive ? (
            isMinting ? (
              <CircularProgress />
            ) : (
              <span className="text-3xl">MINT</span>
            )
          ) : (
            <Countdown
              date={startDate}
              onMount={({ completed }) => completed && setIsActive(true)}
              onComplete={() => setIsActive(true)}
              renderer={renderCounter}
            />
            // <span className="text-sm">COMING SOON</span>
          )}
        </button> : <button
          className="absolute w-30 h-12 font-bold rounded-lg flex justify-center items-center transition-all duration-100 hover:(shadow-md)"
          style={{
            top: 'calc(50% - calc(3rem / 2) - 3.75rem)',
            left: 'calc(50% - calc(7.5rem / 2))',
            backgroundColor: '#B84570'
          }}
        >

          <span className="text-sm">Coming Soon</span>
        </button> 
        }
        
      </div>

      <div
        id="about"
        className="z-20 relative flex flex-col items-center justify-center w-full"
        style={{
          marginTop: '-9rem',
          background: '#F2C56A'
        }}
      >


        <div className="flex flex-col items-center px-12 py-8 w-screen max-w-4xl gap-6 md:(flex-row px-0 w-full)">

          <div
            className="flex flex-col text-center"
            style={{
              fontFamily: 'Kollektif Bold'
            }}
          >
            <h1
              className="text-6xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              About Me
            </h1>
            <img
                src={meImg}
                className="w-60 h-60 self-center inline-flex mt-4 mb-4"
                style={{
                  boxShadow: '-10px 10px 2px 0 #B84570'
                }}
                alt=""
            />
            <span
             className="text-md"
             style={{
                fontWeight: 800
              }}
            >
              <p className={"mt-2"}>Hello. My name is Spencer! I'm 14 years old and I am the Creator of the FLAMINGO MAFIA nft project and I'm the one behind all the art, social media, and much more! My hobby is playing soccer and in my free time I check out the Crypto Space. I am so excited to launch my project and I hope you are excited too!
</p>

              <p className={"mt-2"}> I’m so fascinated by crypto! I love everything about it I believe it's better than fiat and that it's the future of the world, NFTS really inspired me so much when I saw a video from Fewocious (a famous Artist in the NFT SPACE) talking about how she sold a jpeg for thousands. So then I researched about it for a while and started selling my own 1/1 NFTS because I always loved creating art during my free time. So when a new year started 2021, I was scrolling through OpenSea and saw an NFT collection of 10k NFTS they all looked the same can’t remember the exact name right now but I was confused about how that collection made that many NFTS it is basically impossible, it would take a person years to do something like that! So here I am, after all the research, making multiple traits for the Flamingo Mafia NFT collection, learning how to code, errors, etc, I FINALLY DID IT! I made my first NFT collectible Project.
</p>

 <p className={"mt-2"}>But the most important part about my collection, the reason why I really started this. Is because when Covid started in 2020 a lot of people around the world started to be homeless and didn’t have a job because of lockdown and all of that nonsense, I and my family were victims our self, my dad works as a Chiropractor and travels back and forth from our home country to his clinics in a different country every week until Covid happened and he couldn’t fly back and forth anymore because there was a lockdown. Three months into the lockdown my dad got bankrupt, he couldn’t pay our bills anymore we were running out of our savings and couldn’t pay the rent of our house either, so then my dad got worried because he didn’t know what to do anymore and he also got depressed because he couldn’t provide for his family like a parent should do. Europe began to be really crazy there were Riots, military on the streets, and much more crazy stuff that I don’t even want to explain. So we decided to use our last amount of savings, packed our container with all our personal things, and left Europe to go all the way on the other side of the World, a better place with no riots or any trouble like the United States, Europe, etc. My dad set up a clinic in our new home country and got back on our feet.
</p>
 WHY DID I CREATE THIS PROJECT?
        </h1>
        <div className="mt-8 px-10 flex flex-col items-center w-full md:(flex-row flex-wrap items-start max-w-screen-xl)">
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
 <p className={"mt-2"}>So the reason why I have created this project is that I want to help those in need The Homeless, people that don’t have much deserve more in the world like a roof over their head, food, a job, etc. A lot of people (Not saying all) that are middle class or Rich don’t really care about people that are homeless, they care more about their personal life AKA Selfish!
</p>

   <p className={"mt-2"}>LET US MAKE A DIFFERENCE IN THIS WORLD MAFIA!</p>

            </span>
          </div>
        </div>
        
      </div>

      <div
        id="faq"
        className="flex flex-col items-center justify-center w-full py-12"
        style={{
          fontFamily: 'Kollektif',
          backgroundColor: '#B84570'
        }}
      >
        <h1
          className="text-3xl"
          style={{
            fontWeight: 900,
            textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
          }}
        >
          FAQ
        </h1>
        <div className="mt-8 px-10 flex flex-col items-center w-full md:(flex-row flex-wrap items-start max-w-screen-xl)">
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              What is Flamingo Mafia?
            </h1>
            <p>
              A unique NFT collection of 3333 Cool Mafia Birds that rule the Solana Streets. You will be able to use it for commercial or creative rights if owned.
            </p>
          </div>
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              Why should I buy one?
            </h1>
            <p>
              Because they're Flamingos, who doesn't like Flamingos especially these! OK, not only because of that, also because we are going to be DONATING 20% of the launch and because your supporting a young kid that spent a lot of time creating the art keeping up with the socials and much more all by himself.
            </p>
          </div>
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              How was the collection made?
            </h1>
            <p>
              Every 3333 unique mafias are made out of 140+ traits made by Spencer from 7 different categories (Clothes, Backgrounds, Eyes, Eyewear, Hats, Furs, and Neckless).
            </p>
          </div>
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              How can I get one?
            </h1>
            <p>
              When launched you will be able to get one on our website. At the time of purchase, a randomly selected Flamingo mafia will be minted on the blockchain and delivered to your wallet.
            </p>
          </div>
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              What can I do with my Flamingo Mafia?
            </h1>
            <p>
              It's yours. You own it, you have the rights to do anything with it. More plans will be coming soon in the upcoming phases on what you will earn with the Flamingo Mafia NFT that you have.
            </p>
          </div>
          <div className="flex flex-col w-full flex-shrink-0 p-3 md:w-1/2">
            <h1
              className="text-xl"
              style={{
                fontWeight: 900,
                textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              Who is the Creator?
            </h1>
            <p>
              Spencer Ries. A 14 year old boy that loves creating art and joined the NFT space in 2020 and loves IT!
            </p>
          </div>
        </div>
      </div>

      <div
        id="roadmap"
        className="flex flex-col items-center justify-center w-full py-12"
        style={{
          fontFamily: 'Kollektif',
          backgroundColor: '#F2C56A'
        }}
      >
        <h1
          className="text-3xl"
          style={{
            fontWeight: 900,
            textShadow: '2px 2px 10px rgba(0,0,0,0.4)'
          }}
        >
          Roadmap
        </h1>
        <div className="mt-8 flex flex-col justify-center gap-3 w-full px-4 md:(gap-6 w-max-screen-xl)">
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">5%</b>
            <span>Launch the first set of 200 Flamingo Mafia members.</span>
          </div>
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">10%</b>
            <span>
              Marketplace Listings will be pursued once the first set of Flamingo Mafia members sell out.
            </span>
          </div>
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">25%</b>
            <span>
              I will be preparing for the 2nd launch which will have the rest of the 3133 Flamingo Mafia members.
            </span>
          </div>
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">50%</b>
            <span>
              The Flamingo Mafia is not bad and dangerous like you would think, Yes! we do have a soft spot for helping those in need. So that's why we are donating 20% of the profit to the homeless, which will be chosen by the Mafia (community).
            </span>
          </div>
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">75%</b>
            <span>
            Opening a Flamingo Mafia Merch line so that you can show off the Mafia you belong to! And…. 100% of the profit will be going to charities.
            </span>
          </div>
          <div className="flex items-center px-10 py-7 rounded-md border-2 border-black text-black bg-white shadow-md">
            <b className="mr-4 font-bold text-xl">100%</b>
            <span>
              I will be hearing suggestions from the community of what should happen in the 2nd phase, like staking, special airdrops, 3D editions, Tokens, etc.
              <br/>
              There are going to be many awesome things that could possibly happen in the near future. So you never know.
            </span>
          </div>
        </div>
      </div>

      {/* <div
        ref={modalRef}
        className=""
      >
        {wallet && (
          <p>Wallet {shortenAddress(wallet.publicKey.toBase58() || "")}</p>
        )}

        {wallet && <p>Balance: {(balance || 0).toLocaleString()} SOL</p>}

        {wallet && <p>Total Available: {itemsAvailable}</p>}

        {wallet && <p>Redeemed: {itemsRedeemed}</p>}

        {wallet && <p>Remaining: {itemsRemaining}</p>}

        <MintContainer>
          {!wallet ? (
            ""
            // <ConnectButton>Connect Wallet</ConnectButton>
          ) : (
            <MintButton
              disabled={isSoldOut || isMinting || !isActive}
              onClick={onMint}
              variant="contained"
            >
              {isSoldOut ? (
                "SOLD OUT"
              ) : isActive ? (
                isMinting ? (
                  <CircularProgress />
                ) : (
                  "MINT"
                )
              ) : (
                <Countdown
                  date={startDate}
                  onMount={({ completed }) => completed && setIsActive(true)}
                  onComplete={() => setIsActive(true)}
                  renderer={renderCounter}
                />
              )}
            </MintButton>
          )}
        </MintContainer>
      </div> */}

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
