<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import {
  createTask,
  getTaskStatus,
  getTaskOutputs,
  extractUxStringValues,
  getSamplesFromUxString,
  getSamplesFromTask,
  extractValueIDTags,
  parseOutputAndGetSamples,
} from "../services/signaloid.api";

export default defineComponent({
  name: "CurrencyConverterForm",
  setup() {
    const amount = ref<number | null>(null);
    const minRate = ref<number | null>(null);
    const maxRate = ref<number | null>(null);
    const currencyPair = ref<string>("EUR to GBP");
    const resultUrl = ref<string | null>(null);
    const loading = ref<boolean>(false);

    const amountError = ref<string | null>(null);
    const minRateError = ref<string | null>(null);
    const maxRateError = ref<string | null>(null);

    const currencyPairs = ref(["EUR to GBP", "GBP to EUR"]);

    const validateAmount = () => {
      amountError.value = amount.value ? null : "Please enter a valid Amount";
    };

    const validateMinRate = () => {
      minRateError.value = minRate.value
        ? null
        : "Please enter a valid Min Conversion Rate";
    };

    const validateMaxRate = () => {
      maxRateError.value = maxRate.value
        ? null
        : "Please enter a valid Max Conversion Rate";
    };

    const validateInputs = () => {
      validateAmount();
      validateMinRate();
      validateMaxRate();

      return !amountError.value && !minRateError.value && !maxRateError.value;
    };

    const handleConvertCurrency = async () => {
      const isValid = validateInputs();
      loading.value = true;

      if (isValid && currencyPair.value) {
        const [baseCurrency, targetCurrency] = currencyPair.value.split(" to ");
        const valueID = `val_${Math.random().toString(36).substr(2, 32)}`;

        const payload = {
          Type: "SourceCode",
          SourceCode: {
            Object: "SourceCode",
            Code: `
          #include <stdio.h>
          int main() {
            double amount = ${amount.value};
            double minRate = ${minRate.value};
            double maxRate = ${maxRate.value};
            printf("Converting %lf %s to %s with rate between %lf and %lf\\n<ValueID>${valueID}</ValueID> UxString Ux...", 
            amount, "${baseCurrency}", "${targetCurrency}", minRate, maxRate);
            printf("UxString Ux...");
            return 0;
          }
        `,
            Arguments: "",
            Language: "C",
          },
          Overrides: {
            Core: "cor_b21e4de9927158c1a5b603c2affb8a09",
          },
        };

        try {
          const taskResponse = await createTask(payload);

          const taskID = taskResponse.TaskID;
          let taskStatus = taskResponse.Status;

          const delay = (ms) => new Promise((res) => setTimeout(res, ms));
          while (![`Completed`, `Cancelled`, `Stopped`].includes(taskStatus)) {
            await delay(2000);
            const statusResponse = await getTaskStatus(taskID);
            taskStatus = statusResponse.Status;
          }
          const taskOutputs = await getTaskOutputs(taskID);
          await parseOutputAndGetSamples(taskOutputs.Stdout, taskID);

          const uxStringsExtracted = await extractUxStringValues(
            taskOutputs.Stdout
          );
          const uxString =
            uxStringsExtracted[uxStringsExtracted.length - 1].uxString;

          if (uxString) {
            console.log(
              `Generating samples from the distribution with uxString: ${uxString}`
            );
            const url = await getSamplesFromUxString(uxString);
            resultUrl.value = url;
          } else {
            console.error("No UxString found in the task output.");
          }
        } catch (error) {
          console.error("Error converting currency:", error);
        } finally {
          loading.value = false;
        }
      }
    };
    const amountErrorMessages = computed(() =>
      amountError.value ? [amountError.value] : []
    );
    const minRateErrorMessages = computed(() =>
      minRateError.value ? [minRateError.value] : []
    );
    const maxRateErrorMessages = computed(() =>
      maxRateError.value ? [maxRateError.value] : []
    );

    const isFormValid = computed(() => {
      return (
        amount.value !== null &&
        !amountError.value &&
        minRate.value !== null &&
        !minRateError.value &&
        maxRate.value !== null &&
        !maxRateError.value &&
        currencyPair.value !== null
      );
    });

    return {
      amount,
      minRate,
      maxRate,
      currencyPair,
      currencyPairs,
      handleConvertCurrency,
      resultUrl,
      amountError,
      minRateError,
      maxRateError,
      validateAmount,
      validateMinRate,
      validateMaxRate,
      amountErrorMessages,
      minRateErrorMessages,
      maxRateErrorMessages,
      isFormValid,
      loading,
    };
  },
});
</script>

<template>
  <v-container class="p-4">
    <v-card class="p-6">
      <v-card-title class="text-h5 text-center color-secondary">
        Currency Converter
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleConvertCurrency">
          <v-row>
            <v-col cols="12" class="flex justify-center">
              <v-select
                v-model="currencyPair"
                :items="currencyPairs"
                label="Currency Pair"
                class="w-3/5"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" class="flex justify-center">
              <v-text-field
                v-model="amount"
                label="Amount"
                type="number"
                class="w-3/5"
                :error-messages="amountErrorMessages"
                @blur="validateAmount"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="flex justify-center">
              <v-text-field
                v-model="minRate"
                label="Min Conversion Rate"
                type="number"
                step="0.01"
                class="w-3/5"
                :error-messages="minRateErrorMessages"
                @blur="validateMinRate"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="flex justify-center">
              <v-text-field
                v-model="maxRate"
                label="Max Conversion Rate"
                type="number"
                step="0.01"
                class="w-3/5"
                :error-messages="maxRateErrorMessages"
                @blur="validateMaxRate"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" class="flex justify-center">
              <v-btn
                type="submit"
                :loading="loading"
                :disabled="!isFormValid || loading"
                color="primary"
                class="w-3/5"
              >
                Convert
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
        <v-col cols="12" class="flex justify-center">
          <a v-if="resultUrl" :href="resultUrl" target="_blank">
            Click
            <span style="text-decoration: underline; font-weight: bold"
              >here</span
            >
            to view the distribution result
          </a>
        </v-col>
      </v-card-text>
    </v-card>
  </v-container>
</template>
