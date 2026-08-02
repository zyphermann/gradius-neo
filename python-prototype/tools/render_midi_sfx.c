#include <fluidsynth.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void *file_open(const char *path) { return fopen(path, "rb"); }
static int file_read(void *buffer, unsigned int count, void *handle) {
    return fread(buffer, 1, count, (FILE *)handle) == count ? FLUID_OK : FLUID_FAILED;
}
static int file_seek(void *handle, long offset, int origin) {
    return fseek((FILE *)handle, offset, origin) == 0 ? FLUID_OK : FLUID_FAILED;
}
static long file_tell(void *handle) { return ftell((FILE *)handle); }
static int file_close(void *handle) { return fclose((FILE *)handle) == 0 ? FLUID_OK : FLUID_FAILED; }

static void write_u16(FILE *file, uint16_t value) {
    fputc(value & 0xff, file);
    fputc((value >> 8) & 0xff, file);
}

static void write_u32(FILE *file, uint32_t value) {
    write_u16(file, value & 0xffff);
    write_u16(file, value >> 16);
}

static void write_header(FILE *file, uint32_t sample_count, uint32_t sample_rate) {
    const uint32_t data_size = sample_count * 2 * sizeof(int16_t);
    fwrite("RIFF", 1, 4, file);
    write_u32(file, 36 + data_size);
    fwrite("WAVEfmt ", 1, 8, file);
    write_u32(file, 16);
    write_u16(file, 1);
    write_u16(file, 2);
    write_u32(file, sample_rate);
    write_u32(file, sample_rate * 4);
    write_u16(file, 4);
    write_u16(file, 16);
    fwrite("data", 1, 4, file);
    write_u32(file, data_size);
}

int main(int argc, char **argv) {
    if (argc != 4) {
        fprintf(stderr, "usage: %s soundfont.sf2 input.mid output.wav\n", argv[0]);
        return 2;
    }

    const int sample_rate = 44100;
    const int block_size = 256;
    fluid_settings_t *settings = new_fluid_settings();
    fluid_settings_setint(settings, "synth.threadsafe-api", 0);
    fluid_settings_setnum(settings, "synth.sample-rate", sample_rate);
    fluid_settings_setstr(settings, "player.timing-source", "sample");
    fluid_synth_t *synth = new_fluid_synth(settings);
    fluid_sfloader_t *loader = new_fluid_defsfloader(settings);
    fluid_sfloader_set_callbacks(loader, file_open, file_read, file_seek, file_tell, file_close);
    fluid_synth_add_sfloader(synth, loader);
    fluid_player_t *player = new_fluid_player(synth);
    FILE *midi_file = fopen(argv[2], "rb");
    if (!midi_file) return 1;
    fseek(midi_file, 0, SEEK_END);
    long midi_size = ftell(midi_file);
    rewind(midi_file);
    unsigned char *midi_data = malloc((size_t)midi_size);
    if (!midi_data || fread(midi_data, 1, (size_t)midi_size, midi_file) != (size_t)midi_size) return 1;
    fclose(midi_file);
    if (fluid_synth_sfload(synth, argv[1], 1) < 0 ||
        fluid_player_add_mem(player, midi_data, (size_t)midi_size) < 0) {
        fprintf(stderr, "failed to load MIDI or soundfont\n");
        return 1;
    }
    fluid_player_playlist_load(player, 0);

    FILE *output = fopen(argv[3], "wb+");
    if (!output) return 1;
    write_header(output, 0, sample_rate);
    fluid_player_play(player);

    int16_t samples[block_size * 2];
    uint32_t sample_count = 0;
    int tail_blocks = -1;
    while (tail_blocks != 0) {
        fluid_synth_write_s16(synth, block_size, samples, 0, 2, samples, 1, 2);
        fwrite(samples, sizeof(int16_t), block_size * 2, output);
        sample_count += block_size;
        if (fluid_player_get_status(player) == FLUID_PLAYER_DONE && tail_blocks < 0) {
            tail_blocks = (sample_rate * 2) / block_size;
        } else if (tail_blocks > 0) {
            tail_blocks--;
        }
    }

    rewind(output);
    write_header(output, sample_count, sample_rate);
    fclose(output);
    delete_fluid_player(player);
    free(midi_data);
    delete_fluid_synth(synth);
    delete_fluid_settings(settings);
    return 0;
}
