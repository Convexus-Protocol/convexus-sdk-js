
import {CurrencyAmount, Token} from "@convexus/sdk-core";
import { Position } from '../position';

export interface IPositionInfo {
  position: Position;
  tokenId: number;
  owed0: CurrencyAmount<Token>;
  owed1: CurrencyAmount<Token>;
}
