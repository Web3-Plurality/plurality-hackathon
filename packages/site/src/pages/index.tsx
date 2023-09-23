import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
//import { Spinner } from '@chakra-ui/spinner';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  isLocalSnap,
  sendHello,
  getCommitment,
  getZkProof,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  PortToLens,
  CommitmentButton,
  ZKProofButton,
  Card,
} from '../components';
import { defaultSnapOrigin } from '../config';
import { getTwitterID } from '../utils/oauth';
import { ContentFocus, useActiveProfile, useCreatePost, useUpdateProfileDetails, useWalletLogin, useWalletLogout } from '@lens-protocol/react-web';
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

  
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;
const Message = styled.div`
background-color: ${({ theme }) => theme.colors.background.alternative};
border: 1px solid ${({ theme }) => theme.colors.border.default};
color: ${({ theme }) => theme.colors.primary.default};
border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  text-align: center;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;
const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  //border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;



const Index = () => {
  const [hidden, isHidden] = useState(true);

  
useEffect(() => {
  // get the proof request params for this popup
   const params = new URLSearchParams(window.location.search)
   const username = params.get('username')!;
   if (username!=null) {
     //getCommitment();
    //dispatch({ type: MetamaskActions.SetInfoMessage, payload: "Reputation onboarded to chain" });

    const fetchData = async () => {
      // get the data from the api
      isHidden(false);

      await getCommitment();
      dispatch({ type: MetamaskActions.SetInfoMessage, payload: "Reputation onboarded to chain" });
      isHidden(true);

    }
  
    // call the function
    const result = fetchData()
      .catch(console.error);

   }

  
  }, [])
  
  const [state, dispatch] = useContext(MetaMaskContext);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleGetCommitmentClick = async () => {
    try {
      await getTwitterID();
      //dispatch({ type: MetamaskActions.SetInfoMessage, payload: "Reputation onboarded to chain" });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleZkProofClick = async () => {
    try {
      const result = await getZkProof();
      if (result) {
        dispatch({ type: MetamaskActions.SetInfoMessage, payload: "Reputation ownership proved" });
      }
      else 
        dispatch({ type: MetamaskActions.SetInfoMessage, payload: "Reputation invalid" });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };
  
  const { data: publisher, loading } = useActiveProfile();
  const { execute: create, error, isPending } = useCreatePost({ publisher: publisher!, upload: uploadJson });
  const { execute: update, error: updateError, isPending: isUpdatePending } = useUpdateProfileDetails({
    profile: publisher!,
    upload: uploadJson
  });

  async function uploadJson(data: unknown){
    try {
      console.log("uploading post with data: "+ JSON.stringify(data));
      const response = await fetch(process.env.REACT_APP_API_BASE_URL+'/permaweb/', {
        method: 'POST',
        body: JSON.stringify(data), 
        headers: new Headers({'content-type': 'application/json'})
      })
      console.log("got response from api");

      const json = await response.json()
      console.log(json.url);

      return json.url
    } catch(err) {
      console.log({ err })
    }
  }
  async function updateProfile(){
    try {
      console.log("updating profile");
      const params = new URLSearchParams(window.location.search)
      const username = params.get('username')!;

      const name = username;
      const bio = "Hi, I'm " + username;
      const attributes = {
        location: "earth",
        website: "",
        x: "https://x.com/"+username,
      };
      await update({ name, bio, attributes });
      console.log("Profile updated");
    } catch(err) {
      console.log({ err })
    }
  }

  async function createPost() {
    const params = new URLSearchParams(window.location.search)
    const username = params.get('username')!;
    const platform = params.get('id_platform')!;


    const postContent = "Gm folks! \n"+
                        "I just connected my " + platform + " with username "+ username + " \n" +
                        "Let's make social media sovereign!"; 
    try {
    const result = await create({
      content: postContent,
      contentFocus: ContentFocus.TEXT_ONLY,
      locale: 'en',
    })
  }
  catch(err) {
    console.log("err...."+ err);
    console.log(error);
  }
    //console.log("Response from post creation: "+ result);
  }

  const portLensClick = async () => {
    try {
      await createPost();
      await updateProfile();
    }
    catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  };

  return (
    <Container>
      
      <Heading>
        Onboard using <Span>Plurality</Span>
      </Heading>
      <Subtitle>
      Onboard your social profiles on chain
      </Subtitle>
        {!hidden && (
          <Message>
          Connecting on chain...
          {/*<Spinner size="xl" color='red.500'/>*/}
          </Message>

        )}

        {state.infoMessage && (
          <Message>
            <b> {state.infoMessage}</b>
          </Message>
        )}


      <CardContainer>

      
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            disabled={!isMetaMaskReady}
          />
        )}
        <Card
          content={{
            title: 'Connect Reputation for X',
            description:
              'Register your X reputation on-chain using MetaMask.',
            button: (
              <CommitmentButton
                onClick={handleGetCommitmentClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />

        <Card
          content={{
            title: 'Prove Reputation for X',
            description:
              'Prove your X reputation using secrets stored in MetaMask.',
            button: (
              <ZKProofButton
                onClick={handleZkProofClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />


        <Card
          content={{
            title: 'Port profile to lens',
            description:
              'Port your profile to lens.',
            button: (
              <PortToLens
                onClick={portLensClick}
                disabled={!state.installedSnap && !hidden }
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />


        {/*<Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>*/}
      </CardContainer>
    </Container>
  );
};

export default Index;
