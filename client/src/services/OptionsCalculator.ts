export interface OptionPricing {
  callPrice: number;
  putPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  timeValue: number;
  impliedVolatility?: number;
}

export interface OptionParameters {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  dividendYield?: number;
}

export class OptionsCalculator {
  private cumulativeNormalDistribution(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - probability : probability;
  }

  private standardNormalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  calculateD1(params: OptionParameters): number {
    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = params;

    if (timeToExpiry <= 0) return 0;

    const numerator =
      Math.log(spotPrice / strikePrice) +
      (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry;
    const denominator = volatility * Math.sqrt(timeToExpiry);

    return numerator / denominator;
  }

  calculateD2(params: OptionParameters): number {
    const d1 = this.calculateD1(params);
    return d1 - params.volatility * Math.sqrt(params.timeToExpiry);
  }

  calculateBlackScholes(params: OptionParameters): OptionPricing {
    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = params;

    if (timeToExpiry <= 0) {
      const callIntrinsic = Math.max(0, spotPrice - strikePrice);
      const putIntrinsic = Math.max(0, strikePrice - spotPrice);

      return {
        callPrice: callIntrinsic,
        putPrice: putIntrinsic,
        delta: spotPrice > strikePrice ? 1 : 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        intrinsicValue: callIntrinsic,
        timeValue: 0,
      };
    }

    const d1 = this.calculateD1(params);
    const d2 = this.calculateD2(params);

    const Nd1 = this.cumulativeNormalDistribution(d1);
    const Nd2 = this.cumulativeNormalDistribution(d2);
    const Nminusd1 = this.cumulativeNormalDistribution(-d1);
    const Nminusd2 = this.cumulativeNormalDistribution(-d2);

    const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
    const dividendFactor = Math.exp(-dividendYield * timeToExpiry);

    const callPrice =
      spotPrice * dividendFactor * Nd1 -
      strikePrice * discountFactor * Nd2;

    const putPrice =
      strikePrice * discountFactor * Nminusd2 -
      spotPrice * dividendFactor * Nminusd1;

    const callDelta = dividendFactor * Nd1;
    const putDelta = dividendFactor * (Nd1 - 1);

    const gamma =
      (dividendFactor * this.standardNormalPDF(d1)) /
      (spotPrice * volatility * Math.sqrt(timeToExpiry));

    const callTheta =
      (-spotPrice * this.standardNormalPDF(d1) * volatility * dividendFactor) /
        (2 * Math.sqrt(timeToExpiry)) -
      riskFreeRate * strikePrice * discountFactor * Nd2 +
      dividendYield * spotPrice * dividendFactor * Nd1;

    const putTheta =
      (-spotPrice * this.standardNormalPDF(d1) * volatility * dividendFactor) /
        (2 * Math.sqrt(timeToExpiry)) +
      riskFreeRate * strikePrice * discountFactor * Nminusd2 -
      dividendYield * spotPrice * dividendFactor * Nminusd1;

    const vega =
      (spotPrice * dividendFactor * this.standardNormalPDF(d1) * Math.sqrt(timeToExpiry)) / 100;

    const callRho =
      (strikePrice * timeToExpiry * discountFactor * Nd2) / 100;

    const putRho =
      (-strikePrice * timeToExpiry * discountFactor * Nminusd2) / 100;

    const callIntrinsic = Math.max(0, spotPrice - strikePrice);
    const putIntrinsic = Math.max(0, strikePrice - spotPrice);

    return {
      callPrice: Math.max(callPrice, callIntrinsic),
      putPrice: Math.max(putPrice, putIntrinsic),
      delta: callDelta,
      gamma: gamma,
      theta: callTheta / 365,
      vega: vega,
      rho: callRho,
      intrinsicValue: callIntrinsic,
      timeValue: Math.max(0, callPrice - callIntrinsic),
    };
  }

  calculateImpliedVolatility(
    params: Omit<OptionParameters, 'volatility'> & { marketPrice: number; optionType: 'call' | 'put' }
  ): number {
    const { marketPrice, optionType, ...baseParams } = params;

    let volatility = 0.3;
    let maxIterations = 100;
    let tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      const pricing = this.calculateBlackScholes({ ...baseParams, volatility });
      const theoreticalPrice = optionType === 'call' ? pricing.callPrice : pricing.putPrice;
      const priceDifference = theoreticalPrice - marketPrice;

      if (Math.abs(priceDifference) < tolerance) {
        return volatility;
      }

      const vega = pricing.vega * 100;

      if (vega === 0) break;

      volatility = volatility - priceDifference / vega;

      volatility = Math.max(0.01, Math.min(3.0, volatility));
    }

    return volatility;
  }

  calculateAllGreeks(params: OptionParameters): {
    call: OptionPricing;
    put: OptionPricing;
  } {
    const pricing = this.calculateBlackScholes(params);

    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, dividendYield = 0 } = params;

    const d1 = this.calculateD1(params);
    const d2 = this.calculateD2(params);

    const Nd1 = this.cumulativeNormalDistribution(d1);
    const Nminusd1 = this.cumulativeNormalDistribution(-d1);
    const Nminusd2 = this.cumulativeNormalDistribution(-d2);

    const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
    const dividendFactor = Math.exp(-dividendYield * timeToExpiry);

    const putDelta = dividendFactor * (Nd1 - 1);

    const putTheta =
      (-spotPrice * this.standardNormalPDF(d1) * params.volatility * dividendFactor) /
        (2 * Math.sqrt(timeToExpiry)) +
      riskFreeRate * strikePrice * discountFactor * Nminusd2 -
      dividendYield * spotPrice * dividendFactor * Nminusd1;

    const putRho = (-strikePrice * timeToExpiry * discountFactor * Nminusd2) / 100;

    const putIntrinsic = Math.max(0, strikePrice - spotPrice);

    return {
      call: pricing,
      put: {
        callPrice: pricing.putPrice,
        putPrice: pricing.putPrice,
        delta: putDelta,
        gamma: pricing.gamma,
        theta: putTheta / 365,
        vega: pricing.vega,
        rho: putRho,
        intrinsicValue: putIntrinsic,
        timeValue: Math.max(0, pricing.putPrice - putIntrinsic),
      },
    };
  }

  calculatePortfolioGreeks(positions: Array<{
    type: 'call' | 'put';
    quantity: number;
    pricing: OptionPricing;
  }>): {
    totalDelta: number;
    totalGamma: number;
    totalTheta: number;
    totalVega: number;
    totalRho: number;
  } {
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;

    positions.forEach(position => {
      const multiplier = position.type === 'put' ? -1 : 1;
      totalDelta += position.quantity * position.pricing.delta * multiplier;
      totalGamma += position.quantity * position.pricing.gamma;
      totalTheta += position.quantity * position.pricing.theta;
      totalVega += position.quantity * position.pricing.vega;
      totalRho += position.quantity * position.pricing.rho * multiplier;
    });

    return {
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      totalRho,
    };
  }

  generateOptionChain(
    spotPrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    strikePriceRange: { min: number; max: number; step: number },
    dividendYield = 0
  ): Array<{
    strike: number;
    call: OptionPricing;
    put: OptionPricing;
  }> {
    const chain: Array<{
      strike: number;
      call: OptionPricing;
      put: OptionPricing;
    }> = [];

    for (
      let strike = strikePriceRange.min;
      strike <= strikePriceRange.max;
      strike += strikePriceRange.step
    ) {
      const greeks = this.calculateAllGreeks({
        spotPrice,
        strikePrice: strike,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
      });

      chain.push({
        strike,
        call: greeks.call,
        put: greeks.put,
      });
    }

    return chain;
  }
}

export const optionsCalculator = new OptionsCalculator();
