//"use client";
import { FormEvent, useContext, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getThemePreference, getSnap } from '../utils';
import { HeaderButtons } from './Buttons';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { isValidHandle, useCreateProfile, DuplicatedHandleError } from '@lens-protocol/react-web';

import {
  useWalletLogin,
  useWalletLogout,
  useActiveProfile,
} from "@lens-protocol/react-web";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";



const HeaderWrapper = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2.4rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
`;

const Title = styled.p`
  font-size: ${(props) => props.theme.fontSizes.title};
  font-weight: bold;
  margin: 0;
  margin-left: 1.2rem;
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const RightContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Button = styled.button`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }
`;

 
  function CreateProfile() {
    const { data: wallet, loading } = useActiveProfile();
    const { execute, isPending } = useCreateProfile();
 
    const onClick = async () => {
      let handle = window.prompt("Create your lens handle");
      if (handle == null || handle == "") {
        handle = "";
      }  
      const result = await execute({ handle });
 
      if (result.isSuccess()) {
        alert("Profile created!"+ result.value);
        return;
      }
 
      switch (result.error.constructor) {
        case DuplicatedHandleError:
          console.log("Handle already taken");
 
        default:
          alert(`Could not create profile due to: ${result.error.message}`);
      }
    };
 
    return (
      <div>
          <div>
            <Button disabled={isPending} onClick={onClick}>
              Register with lens
            </Button>
            </div>
      </div>
    );
  }
  
  export function Authentication() {
    const { execute: login, isPending: isLoginPending } = useWalletLogin();
    const { data: wallet, loading } = useActiveProfile();
    const { execute: logout } = useWalletLogout();
    const { isConnected } = useAccount();
    const { disconnectAsync } = useDisconnect();
    const { execute, isPending } = useCreateProfile();

  
    const [registerProfile, isRegisterProfile] = useState(false);
    const { connectAsync } = useConnect({
      connector: new InjectedConnector(),
    });

    const onClick = async () => {
      let handle = window.prompt("Create your lens handle");
      if (handle == null || handle == "") {
        handle = "";
      }  
      const result = await execute({ handle });
 
      if (result.isSuccess()) {
        alert("Profile created!");
        alert("Please refresh the browser and sign in!");
        isRegisterProfile(false);
        return;
      }
 
      switch (result.error.constructor) {
        case DuplicatedHandleError:
          console.log("Handle already taken");
          isRegisterProfile(false);

        default:
          alert(`Could not create profile due to: ${result.error.message}`);
          isRegisterProfile(false);

      }
    };
  
    const onLoginClick = async () => {
      if (isConnected) {
        await disconnectAsync();
      }
  
      const { connector } = await connectAsync();
  
      if (connector instanceof InjectedConnector) {
        const walletClient = await connector.getWalletClient();
  
        const result = await login({
          address: walletClient.account.address,
        });
        if (result.isSuccess()) {
          if (result.value == null)
          {
            isRegisterProfile(true);
            alert("No lens profile found. Please register first");
          }
        } else {
          alert(result.error.message);
        }
      }
    };
  
    return (
      <div >
  
        {loading && <p>Loading...</p>}
      
        {!wallet && !loading && !registerProfile && (
          <Button
            disabled={isLoginPending}
            onClick={onLoginClick}
          >
            Sign in with lens
          </Button>
          
        )}
        
        {wallet && !loading && (
          <div>
            <Button onClick={logout}>
              Sign out
            </Button>
            </div>
        )}

        {registerProfile && (
          <div>
            <Button disabled={isPending} onClick={onClick}>
              Register with lens
            </Button>
          </div>
        )}
      </div>
    );
  }
   
export const Header = ({
  handleToggleClick,
}: {
  handleToggleClick(): void;
}) => {
  const { data: wallet, loading } = useActiveProfile();
  //const [lensSignedIn, isLensSignedIn] = useState(false);
  const lensHandle = wallet?.handle.split(".");
  let lensProfile = "";
  if (lensHandle)
  {
    lensProfile = "https://testnet.lenster.xyz/u/"+lensHandle![0];
    //isLensSignedIn(true);
  }
  const theme = useTheme();
  const [state, dispatch] = useContext(MetaMaskContext);

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
  
  return (
    <HeaderWrapper>
      <LogoWrapper>
        <SnapLogo color={theme.colors.icon.default} size={36} />
        <Title>Plurality</Title>
      </LogoWrapper>
      <RightContainer>
        <a href={lensProfile}><b> {lensHandle} </b></a>
        &nbsp;
        &nbsp;
        <Toggle
          onToggle={handleToggleClick}
          defaultChecked={getThemePreference()}
        />
        &nbsp;
        <HeaderButtons state={state} onConnectClick={handleConnectClick} />
        &nbsp;
        <div><Authentication /></div>

      </RightContainer>
    </HeaderWrapper>
  );
};
